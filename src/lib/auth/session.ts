import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import type { UserRole } from "@/lib/constants";
import {
  SESSION_COOKIE,
  SESSION_RENEW_AFTER_HOURS,
  SESSION_TTL_DAYS,
} from "@/lib/constants";
import { ApiError } from "@/lib/api";
import { hashToken, randomToken } from "@/lib/auth/tokens";
import { isProduction } from "@/lib/env";

export interface SessionUser {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  accountStatus: "active" | "suspended" | "disabled";
  emailVerified: boolean;
  avatar?: string;
  sellerStatus?: "active" | "pending" | "suspended";
  shopName?: string;
  shopSlug?: string;
  shopDescription?: string;
  shopLogo?: string;
}

const ROLE_LABEL: Record<UserRole, string> = {
  customer: "customer",
  seller: "seller",
  superadmin: "superadmin",
};

export function sessionExpiry(days = SESSION_TTL_DAYS): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function createSession(
  userId: Types.ObjectId | string,
  userAgent?: string,
): Promise<{ token: string; expiresAt: Date; sessionId: string }> {
  await connectDb();
  const token = randomToken(32);
  const expiresAt = sessionExpiry();
  const session = await Session.create({
    userId,
    tokenHash: hashToken(token),
    userAgent: userAgent?.slice(0, 300),
    expiresAt,
    lastUsedAt: new Date(),
  });
  return { token, expiresAt, sessionId: String(session._id) };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function revokeSessionByToken(token: string): Promise<void> {
  await connectDb();
  await Session.updateOne(
    { tokenHash: hashToken(token), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await connectDb();
  const filter: Record<string, unknown> = { userId, revokedAt: null };
  if (exceptSessionId) filter._id = { $ne: exceptSessionId };
  await Session.updateMany(filter, { $set: { revokedAt: new Date() } });
}

async function loadSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    await connectDb();
    const session = await Session.findOne({
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean();
    if (!session) return null;

    const user = await User.findById(session.userId).lean();
    if (!user) return null;

    if (user.accountStatus !== "active") {
      await Session.updateOne({ _id: session._id }, { $set: { revokedAt: new Date() } });
      return null;
    }

    const renewThreshold = new Date(Date.now() - SESSION_RENEW_AFTER_HOURS * 60 * 60 * 1000);
    if (session.lastUsedAt < renewThreshold) {
      void Session.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } }).catch(
        (error: unknown) => console.error("[auth] failed to update session lastUsedAt", error),
      );
    }

    return {
      id: String(user._id),
      sessionId: String(session._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accountStatus: user.accountStatus,
      emailVerified: user.emailVerified,
      avatar: user.avatar,
      sellerStatus: user.sellerStatus,
      shopName: user.shopName,
      shopSlug: user.shopSlug,
      shopDescription: user.shopDescription,
      shopLogo: user.shopLogo,
    };
  } catch (error) {
    console.error("[auth] session lookup failed", error);
    return null;
  }
}

/** Per-request memoized session lookup. */
export const getCurrentUser = cache(loadSession);

export function dashboardPathForRole(role: UserRole): string {
  if (role === "superadmin") return "/admin";
  if (role === "seller") return "/seller";
  return "/account";
}

export async function requirePageUser(options?: {
  roles?: UserRole[];
  next?: string;
}): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    const next = options?.next ? `?next=${encodeURIComponent(options.next)}` : "";
    redirect(`/login${next}`);
  }
  if (options?.roles && !options.roles.includes(user.role)) {
    redirect(dashboardPathForRole(user.role));
  }
  return user;
}

export async function requireApiUser(options?: { roles?: UserRole[] }): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw ApiError.unauthorized();
  if (options?.roles && !options.roles.includes(user.role)) {
    throw ApiError.forbidden(
      `This action requires the ${options.roles.map((role) => ROLE_LABEL[role]).join(" or ")} role.`,
    );
  }
  return user;
}

export async function requireActiveSeller(): Promise<SessionUser> {
  const user = await requireApiUser({ roles: ["seller"] });
  if (user.sellerStatus === "suspended") {
    throw ApiError.forbidden("Your seller account is suspended. Contact support for assistance.");
  }
  return user;
}

export async function requireActiveSellerPage(): Promise<SessionUser> {
  const user = await requirePageUser({ roles: ["seller"], next: "/seller" });
  if (user.sellerStatus === "suspended") {
    redirect("/account?notice=seller-suspended");
  }
  return user;
}

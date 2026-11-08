import { Types } from "mongoose";
import type { QueryFilter } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { ApiError } from "@/lib/api";
import { User, type IUser } from "@/models/User";
import { Session } from "@/models/Session";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { revokeAllSessions } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";
import { ACCOUNT_STATUSES, USER_ROLES, type AccountStatus, type UserRole } from "@/lib/constants";
import { recordAudit } from "@/services/audit";
import type { Paginated, UserSummaryDTO } from "@/types";
import type { z } from "zod";
import type { changePasswordSchema, profileSchema, shopProfileSchema } from "@/lib/validation/auth";
import type { adminUserUpdateSchema } from "@/lib/validation/product";

type LeanUser = IUser & { _id: Types.ObjectId };

function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

function isAccountStatus(value: string): value is AccountStatus {
  return (ACCOUNT_STATUSES as readonly string[]).includes(value);
}

function toUserSummary(user: LeanUser): UserSummaryDTO {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accountStatus: user.accountStatus,
    sellerStatus: user.sellerStatus,
    emailVerified: user.emailVerified,
    shopName: user.shopName,
    shopSlug: user.shopSlug,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
  };
}

export async function listUsers(options: {
  role?: string;
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<UserSummaryDTO>> {
  await connectDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 60);
  const filter: QueryFilter<IUser> = {};
  if (options.role && options.role !== "all" && isUserRole(options.role)) {
    filter.role = options.role;
  }
  if (options.status && options.status !== "all" && isAccountStatus(options.status)) {
    filter.accountStatus = options.status;
  }
  if (options.q) {
    const pattern = new RegExp(options.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100), "i");
    filter.$or = [{ name: pattern }, { email: pattern }, { shopName: pattern }];
  }
  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanUser[]>(),
    User.countDocuments(filter),
  ]);
  return {
    items: users.map(toUserSummary),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUserDetail(userId: string): Promise<
  | (UserSummaryDTO & {
      productCount: number;
      orderCount: number;
      deliveredRevenueCents: number;
    })
  | null
> {
  await connectDb();
  if (!Types.ObjectId.isValid(userId)) return null;
  const user = await User.findById(userId).lean<LeanUser>();
  if (!user) return null;
  const [productCount, orderCount, revenueRows] = await Promise.all([
    Product.countDocuments({ sellerId: userId }),
    Order.countDocuments(
      user.role === "seller" ? { sellerId: userId } : { customerId: userId },
    ),
    Order.aggregate<{ total: number }>([
      {
        $match: {
          ...(user.role === "seller" ? { sellerId: user._id } : { customerId: user._id }),
          orderStatus: "delivered",
        },
      },
      { $group: { _id: null, total: { $sum: "$totalCents" } } },
    ]),
  ]);
  return {
    ...toUserSummary(user),
    productCount,
    orderCount,
    deliveredRevenueCents: revenueRows[0]?.total ?? 0,
  };
}

export async function adminUpdateUser(
  actor: { id: string; email: string },
  userId: string,
  input: z.infer<typeof adminUserUpdateSchema>,
): Promise<UserSummaryDTO> {
  await connectDb();
  if (!Types.ObjectId.isValid(userId)) throw ApiError.notFound("User not found.");
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("User not found.");

  const isSelf = String(user._id) === actor.id;
  if (isSelf && input.accountStatus && input.accountStatus !== "active") {
    throw ApiError.badRequest("You cannot suspend or disable your own account.");
  }
  if (isSelf && input.role && input.role !== user.role) {
    throw ApiError.badRequest("You cannot change your own role.");
  }

  if (input.role === "superadmin" && user.role !== "superadmin") {
    throw ApiError.forbidden(
      "Superadmin accounts must be provisioned through the secure bootstrap procedure.",
    );
  }

  const losesSuperadmin =
    user.role === "superadmin" &&
    ((input.role && input.role !== "superadmin") ||
      (input.accountStatus && input.accountStatus !== "active"));
  if (losesSuperadmin) {
    const activeSuperadmins = await User.countDocuments({
      role: "superadmin",
      accountStatus: "active",
    });
    if (activeSuperadmins <= 1) {
      throw ApiError.badRequest("At least one active superadmin account must remain.");
    }
  }

  const before = {
    role: user.role,
    accountStatus: user.accountStatus,
    sellerStatus: user.sellerStatus,
    name: user.name,
  };

  if (input.name) user.name = input.name;
  if (input.accountStatus) user.accountStatus = input.accountStatus;
  if (input.sellerStatus && user.role === "seller") user.sellerStatus = input.sellerStatus;
  if (input.role && input.role !== user.role) {
    user.role = input.role;
    if (input.role === "seller") {
      user.sellerStatus = "active";
      if (!user.shopName) user.shopName = user.name;
      if (!user.shopSlug) {
        const base = slugify(user.shopName) || `shop-${Date.now().toString(36)}`;
        let candidate = base;
        let attempt = 0;
        while (await User.exists({ shopSlug: candidate, _id: { $ne: user._id } })) {
          attempt += 1;
          candidate = `${base}-${attempt}`;
        }
        user.shopSlug = candidate;
      }
    }
    if (input.role === "customer") {
      user.sellerStatus = undefined;
    }
  }

  if (input.accountStatus && input.accountStatus !== "active") {
    await revokeAllSessions(String(user._id));
  }

  await user.save();

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "user.updated",
    targetType: "user",
    targetId: String(user._id),
    metadata: {
      before,
      after: {
        role: user.role,
        accountStatus: user.accountStatus,
        sellerStatus: user.sellerStatus,
        name: user.name,
      },
    },
  });

  return toUserSummary(user.toObject() as LeanUser);
}

export async function updateProfile(
  userId: string,
  input: z.infer<typeof profileSchema>,
): Promise<void> {
  await connectDb();
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        name: input.name,
        phone: input.phone || undefined,
        avatar: input.avatar || undefined,
      },
    },
  );
}

export async function changePassword(
  userId: string,
  sessionId: string,
  input: z.infer<typeof changePasswordSchema>,
): Promise<void> {
  await connectDb();
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw ApiError.notFound("Account not found.");
  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest("Your current password is incorrect.");
  user.passwordHash = await hashPassword(input.newPassword);
  await user.save();
  await revokeAllSessions(userId, sessionId);
}

export async function updateShopProfile(
  sellerId: string,
  input: z.infer<typeof shopProfileSchema>,
): Promise<void> {
  await connectDb();
  const user = await User.findById(sellerId);
  if (!user || user.role !== "seller") throw ApiError.notFound("Seller account not found.");

  const base = slugify(input.shopName);
  if (!base) throw ApiError.badRequest("Shop name must contain letters or numbers.");
  let shopSlug = user.shopSlug;
  if (!shopSlug || (user.shopName && slugify(user.shopName) !== base)) {
    let candidate = base;
    let attempt = 0;
    while (await User.exists({ shopSlug: candidate, _id: { $ne: user._id } })) {
      attempt += 1;
      candidate = `${base}-${attempt}`;
    }
    shopSlug = candidate;
  }

  user.shopName = input.shopName;
  user.shopDescription = input.shopDescription || undefined;
  user.shopLogo = input.shopLogo || undefined;
  user.phone = input.phone || undefined;
  user.shopSlug = shopSlug;
  await user.save();
}

export async function listActiveSessions(userId: string) {
  await connectDb();
  const sessions = await Session.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ lastUsedAt: -1 })
    .lean();
  return sessions.map((session) => ({
    id: String(session._id),
    userAgent: session.userAgent ?? "Unknown device",
    createdAt: session.createdAt.toISOString(),
    lastUsedAt: session.lastUsedAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
  }));
}

export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  await connectDb();
  if (!Types.ObjectId.isValid(sessionId)) throw ApiError.notFound("Session not found.");
  await Session.updateOne(
    { _id: sessionId, userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

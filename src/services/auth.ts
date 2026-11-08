import { connectDb } from "@/lib/db/connect";
import { ApiError } from "@/lib/api";
import { emailConfig, env } from "@/lib/env";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  hashToken,
  randomToken,
  resetTokenExpiry,
  verificationTokenExpiry,
} from "@/lib/auth/tokens";
import { createSession, revokeAllSessions } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";
import { sendEmail } from "@/services/email";
import { notify } from "@/services/notifications";
import type { z } from "zod";
import type { loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validation/auth";

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type ResetInput = z.infer<typeof resetPasswordSchema>;

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: "customer" | "seller" | "superadmin";
    accountStatus: "active" | "suspended" | "disabled";
    sellerStatus?: "active" | "pending" | "suspended";
    shopName?: string;
    shopSlug?: string;
  };
  token: string;
  expiresAt: Date;
}

async function uniqueShopSlug(name: string): Promise<string> {
  const base = slugify(name) || `shop-${Date.now().toString(36)}`;
  let candidate = base;
  for (let i = 0; i < 5; i += 1) {
    const exists = await User.exists({ shopSlug: candidate });
    if (!exists) return candidate;
    candidate = `${base}-${Math.random().toString(16).slice(2, 7)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function publicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: "customer" | "seller" | "superadmin";
  accountStatus: "active" | "suspended" | "disabled";
  sellerStatus?: "active" | "pending" | "suspended";
  shopName?: string;
  shopSlug?: string;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
    sellerStatus: user.sellerStatus,
    shopName: user.shopName,
    shopSlug: user.shopSlug,
  };
}

export async function registerUser(
  input: RegisterInput,
  meta: { userAgent?: string },
): Promise<{ result: AuthResult; verificationEmailSent: boolean }> {
  await connectDb();
  const existing = await User.findOne({ email: input.email }).select("_id").lean();
  if (existing) {
    throw ApiError.conflict("An account with this email already exists.");
  }

  const passwordHash = await hashPassword(input.password);
  const isSeller = input.role === "seller";
  const shopSlug = isSeller ? await uniqueShopSlug(input.shopName ?? input.name) : undefined;

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    phone: input.phone || undefined,
    role: input.role,
    accountStatus: "active",
    emailVerified: false,
    sellerStatus: isSeller ? "active" : undefined,
    shopName: isSeller ? input.shopName : undefined,
    shopSlug,
  });

  const verificationToken = randomToken(24);
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        verificationTokenHash: hashToken(verificationToken),
        verificationExpiresAt: verificationTokenExpiry(),
      },
    },
  );

  const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken);

  const session = await createSession(user._id, meta.userAgent);

  await notify({
    userId: user._id,
    type: "account",
    title: "Welcome to FurnitureX",
    message: isSeller
      ? "Your seller account is ready. Add your first listing to begin the approval process."
      : "Your account is ready. Discover considered furniture from independent makers.",
    link: isSeller ? "/seller" : "/marketplace",
  });

  return {
    result: {
      user: publicUser(user),
      token: session.token,
      expiresAt: session.expiresAt,
    },
    verificationEmailSent: emailResult.sent,
  };
}

async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
): Promise<{ sent: boolean }> {
  const config = emailConfig();
  if (!config.configured) return { sent: false };
  const link = `${env().APP_URL}/verify-email?token=${token}`;
  const result = await sendEmail({
    to: email,
    subject: "Verify your FurnitureX email address",
    text: `Hello ${name}, verify your FurnitureX email address: ${link}`,
    html: `<p>Hello ${name},</p><p>Please verify your FurnitureX email address.</p><p><a href="${link}">Verify email</a></p><p>This link expires in 48 hours.</p>`,
  });
  return { sent: result.sent };
}

export async function loginUser(
  input: LoginInput,
  meta: { userAgent?: string },
): Promise<AuthResult> {
  await connectDb();
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  const invalid = new ApiError(401, "UNAUTHORIZED", "Email or password is incorrect.");

  if (!user) {
    await hashPassword(input.password).catch(() => undefined);
    throw invalid;
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw invalid;

  if (user.accountStatus !== "active") {
    throw ApiError.forbidden(
      "This account is not available. Please contact FurnitureX support for assistance.",
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const session = await createSession(user._id, meta.userAgent);

  return {
    user: publicUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function requestPasswordReset(email: string): Promise<{ sent: boolean }> {
  if (!emailConfig().configured) {
    throw new ApiError(
      503,
      "CONFIGURATION_REQUIRED",
      "Password recovery requires email delivery to be configured. Please contact support.",
    );
  }
  await connectDb();
  const user = await User.findOne({ email }).lean();
  const token = randomToken(24);
  if (user) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordTokenHash: hashToken(token),
          resetPasswordExpiresAt: resetTokenExpiry(1),
        },
      },
    );
    const link = `${env().APP_URL}/reset-password?token=${token}`;
    const result = await sendEmail({
      to: user.email,
      subject: "Reset your FurnitureX password",
      text: `Reset your FurnitureX password using this link (valid for 1 hour): ${link}`,
      html: `<p>Reset your FurnitureX password using the link below. It is valid for 1 hour.</p><p><a href="${link}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    });
    return { sent: result.sent };
  }
  return { sent: true };
}

export async function resetPasswordWithToken(input: ResetInput): Promise<void> {
  await connectDb();
  const tokenHash = hashToken(input.token);
  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");

  if (!user) {
    throw ApiError.badRequest("This reset link is invalid or has expired.");
  }

  user.passwordHash = await hashPassword(input.password);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpiresAt = null;
  await user.save();
  await revokeAllSessions(String(user._id));
  await Session.deleteMany({ userId: user._id, revokedAt: { $ne: null } });
}

export async function verifyEmailToken(token: string): Promise<string> {
  await connectDb();
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    verificationTokenHash: tokenHash,
    verificationExpiresAt: { $gt: new Date() },
  }).select("+verificationTokenHash +verificationExpiresAt");
  if (!user) {
    throw ApiError.badRequest("This verification link is invalid or has expired.");
  }
  user.emailVerified = true;
  user.verificationTokenHash = null;
  user.verificationExpiresAt = null;
  await user.save();
  return user.email;
}

export async function resendVerificationEmail(userId: string): Promise<{ sent: boolean }> {
  await connectDb();
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound("Account not found.");
  if (user.emailVerified) return { sent: true };
  const token = randomToken(24);
  user.verificationTokenHash = hashToken(token);
  user.verificationExpiresAt = verificationTokenExpiry();
  await user.save();
  return sendVerificationEmail(user.email, user.name, token);
}

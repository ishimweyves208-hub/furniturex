import "./load-env";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Session } from "@/models/Session";
import { hashPassword, passwordIssues } from "@/lib/auth/password";
import { slugify } from "@/lib/utils";

async function main() {
  const name = process.env.SUPERADMIN_NAME?.trim();
  const email = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Set SUPERADMIN_NAME, SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in .env.local before running this script.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("SUPERADMIN_EMAIL is not a valid email address.");
  }
  const issues = passwordIssues(password);
  if (issues.length > 0) {
    throw new Error(`SUPERADMIN_PASSWORD is too weak: ${issues.join(" ")}`);
  }

  await connectDb();
  const passwordHash = await hashPassword(password);
  const existing = await User.findOne({ email });

  if (existing && existing.role !== "superadmin") {
    throw new Error(
      `An account with ${email} already exists with role "${existing.role}". Refusing to escalate it automatically. Use a different email or change the role in the database explicitly.`,
    );
  }

  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = "superadmin";
    existing.accountStatus = "active";
    existing.emailVerified = true;
    existing.sellerStatus = undefined;
    existing.shopName = undefined;
    existing.shopSlug = undefined;
    await existing.save();
    await Session.updateMany({ userId: existing._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    console.log(`Updated superadmin account: ${email}`);
  } else {
    await User.create({
      name,
      email,
      passwordHash,
      role: "superadmin",
      accountStatus: "active",
      emailVerified: true,
    });
    console.log(`Created superadmin account: ${email}`);
  }

  const base = slugify(name) || "operator";
  console.log(`All existing sessions were revoked. Sign in at /login as ${email} (role: superadmin, slug: ${base}).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });

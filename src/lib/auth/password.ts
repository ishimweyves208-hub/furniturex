import bcrypt from "bcryptjs";

const ROUNDS = 11;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < 8) issues.push("Use at least 8 characters.");
  if (!/[a-zA-Z]/.test(password)) issues.push("Include at least one letter.");
  if (!/[0-9]/.test(password)) issues.push("Include at least one number.");
  return issues;
}

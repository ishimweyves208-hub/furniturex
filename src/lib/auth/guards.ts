import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/lib/constants";
import { ApiError } from "@/lib/api";

export async function withApiUser(
  _request: NextRequest,
  handler: (user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) => Promise<NextResponse>,
  roles?: UserRole[],
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "You must be signed in." } }, { status: 401 });
  if (roles && !roles.includes(user.role)) {
    return NextResponse.json({ ok: false, error: { code: "FORBIDDEN", message: "You do not have permission." } }, { status: 403 });
  }
  try {
    return await handler(user);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw error;
  }
}

export function hasSessionCookie(request: NextRequest): boolean {
  return Boolean(request.cookies.get(SESSION_COOKIE)?.value);
}

js
import { NextResponse } from "next/server";

const COOKIE_NAME = "site_gate";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Always let these through, or nobody could ever log in
  if (
    pathname.startsWith("/site-login") ||
    pathname.startsWith("/api/site-login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  const expected = process.env.ADMIN_PASSWORD;

  if (expected && cookie?.value === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/site-login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

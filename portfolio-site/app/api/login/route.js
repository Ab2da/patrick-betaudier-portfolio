import { NextResponse } from "next/server";
import { isValidPassword, getSessionCookie } from "../../../lib/auth";

export async function POST(request) {
  const { password } = await request.json();

  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const { name, value } = getSessionCookie();
  res.cookies.set(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}

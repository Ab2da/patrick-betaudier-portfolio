import crypto from "crypto";

export const COOKIE = "admin_session";

function sessionToken() {
  const secret = process.env.ADMIN_PASSWORD || "dev-secret-fallback";
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function isValidPassword(pw) {
  return !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}

export function getSessionCookie() {
  return { name: COOKIE, value: sessionToken() };
}

export function isAuthed(request) {
  const cookie = request.cookies.get(COOKIE);
  return !!cookie && cookie.value === sessionToken();
}

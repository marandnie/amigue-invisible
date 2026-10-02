// Auth.js v5 middleware — uses the `authorized` callback from lib/auth.ts
// to decide whether to let a request through. Unauthorized users trying to
// reach a protected route get redirected to /login.
export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Run on everything except static assets and the Next.js internals.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};

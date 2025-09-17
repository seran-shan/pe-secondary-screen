import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const isPublicRoute =
    nextUrl.pathname.startsWith("/auth") ||
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname === "/";

  // If not logged in and trying to access protected route, redirect to sign-in
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/sign-in", nextUrl));
  }

  // If logged in and trying to access sign-in page (but allow sign-out page)
  if (isLoggedIn && nextUrl.pathname === "/auth/sign-in") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match all routes except:
    // - api routes (excluding auth)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public files (public folder)
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

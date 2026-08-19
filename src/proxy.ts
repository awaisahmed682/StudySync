import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const publicRoutes = ["/login", "/register", "/debug-cal"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return false;
  return publicRoutes.some((r) => pathname.startsWith(r));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;
  const session = token ? await decrypt(token) : null;

  const isPublic = isPublicPath(pathname);

  if (!isPublic && !session?.userId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && session?.userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)",
  ],
};
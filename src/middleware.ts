// src/middleware.ts
// Route protection middleware — runs on Edge, uses JWT session cookie

import { NextRequest, NextResponse } from "next/server";
import { isIdle, verifySessionToken } from "@/lib/session";

const MEMBER_ROUTES = [
  "/profil",
  "/messages",
  "/rendez-vous",
  "/paiements",
  "/notifications",
  "/parametres",
];

const AUTH_ONLY_ROUTES = ["/connexion", "/inscription"];
const ONBOARDING_ROUTE = "/onboarding";
const SESSION_COOKIE = "mmclub_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static/internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.match(/\.(ico|png|jpg|svg|webp|json|txt|xml)$/)
  ) {
    return NextResponse.next();
  }

  // Get session from cookie
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const rawSession = token ? await verifySessionToken(token) : null;
  // 30 minutes sans activité → session verrouillée, reconnexion obligatoire
  const idle = isIdle(rawSession);
  const session = idle ? null : rawSession;

  const isMemberRoute = MEMBER_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboarding = pathname.startsWith(ONBOARDING_ROUTE);

  // 1. Unauthenticated → redirect away from protected routes
  if (isMemberRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
    if (idle) url.searchParams.set("reason", "inactivite");
    return NextResponse.redirect(url);
  }

  // 2. Authenticated → redirect away from auth pages
  if (isAuthRoute && session) {
    const url = request.nextUrl.clone();
    url.pathname = session.status === "ONBOARDING" ? ONBOARDING_ROUTE : "/messages";
    return NextResponse.redirect(url);
  }

  // 3. Onboarding user → must finish onboarding before accessing member area
  if (session?.status === "ONBOARDING" && isMemberRoute && !isOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = ONBOARDING_ROUTE;
    return NextResponse.redirect(url);
  }

  // 4. Active user → skip onboarding
  if (session?.status === "ACTIVE" && isOnboarding) {
    const url = request.nextUrl.clone();
    url.pathname = "/decouverte";
    return NextResponse.redirect(url);
  }

  // 5. Banned users → redirect everywhere
  if (session?.status === "BANNED" && (isMemberRoute || isOnboarding)) {
    const url = request.nextUrl.clone();
    url.pathname = "/compte-suspendu";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icons|logo|manifest|public).*)"],
};

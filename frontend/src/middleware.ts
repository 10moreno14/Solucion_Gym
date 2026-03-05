import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', 
  '/panel-gym(.*)', 
  '/mi-gym(.*)'
]);

const isTecnicoRoute = createRouteMatcher(['/dashboard(.*)']);
const isGymRoute = createRouteMatcher(['/panel-gym(.*)']);
const isMemberRoute = createRouteMatcher(['/mi-gym(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { userId, sessionClaims, orgRole } = await auth();

  // 🌟 1. EL LIMPIADOR UNIVERSAL DE ROLES
  // Tomamos el rol de la metadata personal o de la organización.
  const rawRole = (sessionClaims as any)?.metadata?.rol || orgRole || null;
  // Si trae el prefijo "org:", se lo quitamos. Así "org:gimnasio" pasa a ser "gimnasio".
  const rol = rawRole?.startsWith('org:') ? rawRole.replace('org:', '') : rawRole;

  // 2. REDIRECCIÓN EXPRÉS DESDE EL INICIO (/)
  if (pathname === "/" && userId) {
    // Si no tiene rol aún, lo mandamos a /panel-gym para que el page.tsx lo sincronice
    if (!rol) return NextResponse.redirect(new URL("/panel-gym", req.url));

    // Usamos el rol ya limpio
    if (rol === "gimnasio" || rol === "admin") 
      return NextResponse.redirect(new URL("/panel-gym", req.url));
    
    if (rol === "tecnico") return NextResponse.redirect(new URL("/dashboard", req.url));
    if (rol === "afiliado") return NextResponse.redirect(new URL("/mi-gym", req.url));
  }

  // 3. Proteger las rutas privadas
  if (isProtectedRoute(req)) {
    if (!userId) {
      // Si no hay sesión, Clerk maneja el login automáticamente con protect()
      await auth.protect();
      return;
    }

    // 4. LÓGICA DE ROLES (RBAC) USANDO EL ROL LIMPIO
    if (isGymRoute(req)) {
      // 🛡️ Nota: Si en Clerk vas a invitar recepcionistas usando el rol por defecto "Member",
      // deberías añadir && rol !== "member" en esta validación para no bloquearlos.
      if (rol && rol !== "gimnasio" && rol !== "admin" && rol !== "admin_gim") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    if (isTecnicoRoute(req) && rol && rol !== "tecnico") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (isMemberRoute(req) && rol && rol !== "afiliado") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
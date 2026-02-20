import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 1. Definimos qué rutas requieren que el usuario esté logueado.
// En este caso, cualquier ruta que comience con /dashboard
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // 2. Si el usuario intenta entrar a una ruta protegida...
  if (isProtectedRoute(req)) {
    // 3. Forzamos la protección. Si no hay sesión, Clerk lo 
    // redirigirá automáticamente al inicio o al login.
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Mantenemos tu configuración de matcher que es estándar de Next.js
    "/((?!.*\\..*|_next).*)", 
    "/", 
    "/(api|trpc)(.*)"
  ],
};
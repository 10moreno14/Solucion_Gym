import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// 🔥 LA MAGIA: Prohíbe el caché estático para que no tengas que usar F5 🔥
export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId, sessionClaims } = await auth();

  // 1. SI ESTÁ LOGUEADO: Redirección inmediata desde el servidor
  if (userId) {
    const rol = (sessionClaims as any)?.metadata?.rol || (sessionClaims as any)?.o?.rol;
    
    if (rol === "gimnasio" || rol === "admin") redirect("/panel-gym");
    if (rol === "tecnico") redirect("/dashboard");
    if (rol === "afiliado") redirect("/mi-gym");
    
    redirect("/unauthorized");
  }

  // 2. SI NO ESTÁ LOGUEADO: Renderiza la vista principal
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-gray-700">
        <h1 className="text-4xl font-bold mb-2 text-blue-500">Solución Gym</h1>
        <p className="text-gray-400 mb-8">Gestión inteligente para tu negocio</p>

        {/* Muestra el botón SOLO si el usuario no tiene sesión */}
        <SignedOut>
          <SignInButton forceRedirectUrl="/">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all">
              Iniciar Sesión / Registrarse
            </button>
          </SignInButton>
        </SignedOut>

        {/* Si el cliente detecta sesión antes del salto, muestra esto en vez del botón */}
        <SignedIn>
          <div className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg animate-pulse">
            Entrando a tu panel...
          </div>
        </SignedIn>

      </div>
    </main>
  );
}
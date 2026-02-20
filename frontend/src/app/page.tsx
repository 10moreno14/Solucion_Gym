import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-gray-700">
        <h1 className="text-4xl font-bold mb-2 text-blue-500">Solución Gym</h1>
        <p className="text-gray-400 mb-8">Gestión inteligente para tu negocio</p>

        <SignedOut>
          <SignInButton mode="modal">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all">
              Iniciar Sesión / Registrarse
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <UserButton showName />
            <div className="text-green-400 font-medium">¡Bienvenido de nuevo!</div>
            
            {/* AQUÍ ESTÁ EL CAMBIO: Usamos Link para navegar al Dashboard */}
            <Link href="/dashboard" className="w-full">
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded transition-all">
                Ir al Panel de Control
              </button>
            </Link>

          </div>
        </SignedIn>
      </div>
    </main>
  );
}
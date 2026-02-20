"use client"; // 👈 Necesario para usar el estado del menú
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wrench, 
  Users, // 👈 Importamos el nuevo icono
  Menu as MenuIcon, 
  X, 
  Dumbbell 
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Función para cerrar el menú al hacer clic en un enlace (móvil)
  const closeMenu = () => setIsMobileMenuOpen(false);

  // Clase para los links activos
  const linkClass = (href: string) => `
    flex items-center gap-3 p-3 rounded-lg transition-all font-medium
    ${pathname === href 
      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
      : "text-slate-300 hover:bg-slate-800 hover:text-white"}
  `;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* 🌑 OVERLAY MÓVIL (Fondo oscuro) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* 🛠️ MENÚ LATERAL (SIDEBAR) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col shadow-xl 
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static md:flex
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="text-blue-400" size={24} />
              <h1 className="text-xl font-extrabold tracking-tight">Solución Gym</h1>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Admin Panel</p>
          </div>
          {/* Botón cerrar (Solo móvil) */}
          <button onClick={closeMenu} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link href="/dashboard" onClick={closeMenu} className={linkClass("/dashboard")}>
            <LayoutDashboard size={20} /> Resumen General
          </Link>

          {/* 👥 SECCIÓN CLIENTES (NUEVA) */}
          <Link href="/dashboard/clientes" onClick={closeMenu} className={linkClass("/dashboard/clientes")}>
            <Users size={20} /> Clientes
          </Link>

          <Link href="/dashboard/mantenimiento" onClick={closeMenu} className={linkClass("/dashboard/mantenimiento")}>
            <Wrench size={20} /> Mantenimiento
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-600 text-center uppercase tracking-widest">
          v1.0.0
        </div>
      </aside>

      {/* 🖥️ ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Barra superior (Topbar) */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
          
          {/* Botón Hamburguesa (Solo móvil) */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <MenuIcon size={24} />
          </button>

          <h2 className="text-lg font-bold text-gray-800 md:hidden flex items-center gap-2">
             <Dumbbell className="text-blue-600" size={20} /> Solución Gym
          </h2>

          <div className="flex-1"></div> {/* Espaciador */}

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm font-medium text-gray-500 border-r pr-4 border-gray-200">
              {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
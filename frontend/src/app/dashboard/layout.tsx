"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Wrench, 
  Users, 
  Monitor,
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

  const closeMenu = () => setIsMobileMenuOpen(false);

  // Clase para los links activos/inactivos
  const linkClass = (href: string) => `
    flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm
    ${pathname === href 
      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
      : "text-slate-400 hover:bg-slate-800 hover:text-white"}
  `;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* 🌑 OVERLAY MÓVIL */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={closeMenu}
        />
      )}

      {/* Sidebar (Menú Lateral) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}>
        {/* Cabecera del Sidebar */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="text-blue-400" size={24} />
              <h1 className="text-xl font-black tracking-tight uppercase">Solución Gym</h1>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Admin Panel</p>
          </div>
          <button onClick={closeMenu} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        {/* Navegación Principal */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link href="/dashboard" onClick={closeMenu} className={linkClass("/dashboard")}>
            <LayoutDashboard size={20} /> Resumen General
          </Link>

          <Link href="/dashboard/clientes" onClick={closeMenu} className={linkClass("/dashboard/clientes")}>
            <Users size={20} /> Clientes
          </Link>

          <Link href="/dashboard/equipos" onClick={closeMenu} className={linkClass("/dashboard/equipos")}>
            <Monitor size={20} /> Equipos
          </Link>

          <Link href="/dashboard/mantenimiento" onClick={closeMenu} className={linkClass("/dashboard/mantenimiento")}>
            <Wrench size={20} /> Mantenimiento
          </Link>
        </nav>

        {/* Pie del Sidebar */}
        <div className="p-6 border-t border-slate-800 text-[10px] text-slate-600 text-center font-bold uppercase tracking-widest">
          v1.2.0 • 2026
        </div>
      </aside>

      {/* 🖥️ ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Barra superior (Topbar) */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
          
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <MenuIcon size={24} />
          </button>

          <h2 className="text-lg font-bold text-gray-800 md:hidden flex items-center gap-2">
             <Dumbbell className="text-blue-600" size={20} /> SOLUCIÓN GYM
          </h2>

          <div className="flex-1"></div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end border-r pr-4 border-gray-200">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Fecha Hoy</span>
               <span className="text-sm font-black text-slate-800">
                {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
               </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL CON SCROLL INDEPENDIENTE */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
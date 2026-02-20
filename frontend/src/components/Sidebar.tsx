"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Wrench, 
  Menu, 
  X, 
  Dumbbell, 
  Users, 
  Monitor 
} from "lucide-react";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 🛡️ Agregamos Clientes y Equipos a la lista
  const menuItems = [
    { name: "Resumen General", href: "/dashboard", icon: LayoutDashboard },
    { name: "Mantenimiento", href: "/dashboard/mantenimiento", icon: Wrench },
    { name: "Clientes", href: "/dashboard/clientes", icon: Users },
    { name: "Equipos", href: "/dashboard/equipos", icon: Monitor },
  ];

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 w-full bg-slate-900 text-white p-4 flex justify-between items-center z-50 shadow-md">
        <div className="flex items-center gap-2">
            <Dumbbell className="text-blue-500" size={24} />
            <span className="font-bold tracking-tight uppercase">SOLUCIÓN GYM</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)}/>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:block
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="hidden lg:flex items-center gap-3 mb-10 px-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                <Dumbbell size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">Solución Gym</span>
          </div>

          <nav className="flex-1 space-y-2 mt-16 lg:mt-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"}
                  `}
                >
                  <Icon size={22} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center font-bold">
              Mantenimiento v1.2 • 2026
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
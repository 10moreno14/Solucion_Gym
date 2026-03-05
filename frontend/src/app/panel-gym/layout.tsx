"use client";

import { useState, useEffect } from "react";
// 🌟 Añadimos useUser y useOrganization a los imports de Clerk
import { UserButton, useAuth, OrganizationSwitcher, useUser, useOrganization } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; 
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  QrCode, 
  Wallet,
  Menu as MenuIcon, 
  X,
  Activity,
} from "lucide-react";
import { API_URL } from "@/config";

export default function GymPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [modulos, setModulos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  
  const pathname = usePathname();
  const router = useRouter(); 
  
  // 🌟 Extraemos user y organization para tener los nombres reales
  const { orgId, userId, getToken, orgRole } = useAuth(); 
  const { user } = useUser();
  const { organization } = useOrganization();

  const closeMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const fetchModulos = async () => {
      const tenantId = orgId || userId; 
      
      if (!tenantId) {
        setLoading(false);
        return;
      }

      try {
        const token = await getToken(); 
        
        // 🌟 Construimos los nombres para enviarlos al backend
        const fullName = user ? `${user.firstName} ${user.lastName || ""}` : "";
        const orgName = organization?.name || "";

        // 🌟 URL ACTUALIZADA: Ahora enviamos los 4 parámetros que el backend espera
        // Usamos encodeURIComponent para evitar errores con espacios o tildes
        const url = `${API_URL}/get-modules-config?` + 
                    `clerkId=${userId}&` + 
                    `orgId=${orgId || ''}&` + 
                    `fullName=${encodeURIComponent(fullName)}&` + 
                    `orgName=${encodeURIComponent(orgName)}`;

        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();

          if (data.isActive === false) {
            router.push('/unauthorized?reason=suspended');
            return; 
          }

          setModulos(data.modulos || {});
        } else {
          // Fallback en caso de error
          setModulos({ dashboard: true, planes: true, afiliados: true, accesos: true, caja: true });
        }
      } catch (error) {
        console.error("Error cargando módulos:", error);
        setModulos({ dashboard: true });
      } finally {
        setLoading(false);
      }
    };

    // 🌟 Añadimos organization?.name a las dependencias para que se recargue si cambias el nombre en Clerk
    fetchModulos();
  }, [orgId, userId, getToken, router, user, organization?.name]); 

  const menuItems = [
    { name: "Dashboard", href: "/panel-gym", icon: LayoutDashboard, key: "dashboard" },
    { name: "Planes", href: "/panel-gym/planes", icon: Dumbbell, key: "planes" },
    { name: "Afiliados", href: "/panel-gym/afiliados", icon: Users, key: "afiliados" },
    { name: "Accesos", href: "/panel-gym/accesos", icon: QrCode, key: "accesos" },
    { name: "Caja", href: "/panel-gym/caja", icon: Wallet, key: "caja" },
  ];

  const menuFiltrado = menuItems.filter(item => {
    if (loading) return false; 
    return modulos[item.key] === true;
  });

  const linkClass = (href: string) => `
    flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm
    ${pathname === href 
      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" 
      : "text-slate-400 hover:bg-slate-800 hover:text-white"}
  `;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={closeMenu} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="text-emerald-400" size={24} />
              {/* 🌟 TÍTULO DINÁMICO: Ahora muestra el nombre de la organización o un fallback */}
              <h1 className="text-xl font-black tracking-tight uppercase truncate max-w-[180px]">
                {organization?.name || "Mi Gimnasio"}
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Panel de Administración</p>
          </div>
          <button onClick={closeMenu} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {loading ? (
             <div className="p-4 text-xs text-slate-500 animate-pulse">Verificando accesos...</div>
          ) : (
            menuFiltrado.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} onClick={closeMenu} className={linkClass(item.href)}>
                  <Icon size={20} /> {item.name}
                </Link>
              );
            })
          )}
        </nav>

        <div className="p-6 border-t border-slate-800 text-[10px] text-slate-600 text-center font-bold uppercase tracking-widest">
          Solución Gym v1.0
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center shadow-sm sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <MenuIcon size={24} />
          </button>
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <OrganizationSwitcher 
                hidePersonal={true}
                appearance={{
                  elements: {
                    organizationSwitcherPopoverActionButton__createOrganization: "hidden",
                  }
                }}
              />
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
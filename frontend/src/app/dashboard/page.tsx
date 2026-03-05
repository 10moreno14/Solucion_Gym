import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  Users, 
  Plus, 
  ArrowRight, 
  ClipboardCheck, 
  Calendar,
  Monitor
} from "lucide-react";
import { API_URL } from "@/config"; // 👈 API centralizada

export default async function DashboardPage() {
  const { userId, getToken } = await auth();
  const user = await currentUser();

  // Si no hay usuario, redirigir al login
  if (!userId || !user) redirect("/");

  const token = await getToken();
  const nombreCompleto = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario';
  const email = user.emailAddresses[0]?.emailAddress || '';

  // 1. DEFINIR VALORES INICIALES (Para que nunca sea undefined)
  let stats = { reports: 0, clients: 0, machines: 0 };
  let latestReports = [];
  
  try {
    // Sincronizar usuario 
    await fetch(`${API_URL}/sync-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ clerkId: userId, email, fullName: nombreCompleto }),
    });

    // Pedir estadísticas al backend
    const resStats = await fetch(`${API_URL}/get-stats?clerkId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    });

    if (resStats.ok) {
      const data = await resStats.json();
      // Solo actualizamos si la data trae lo que necesitamos
      if (data.stats) stats = data.stats;
      if (data.latestReports) latestReports = data.latestReports;
    }
  } catch (error) {
    console.error("⚠️ Error conectando al servidor:", error);
    // No lanzamos error, dejamos que la página cargue con ceros
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Encabezado */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          ¡Hola, {user.firstName}! 👋
        </h2>
        <p className="text-slate-500 font-medium tracking-tight">
          Bienvenido al panel de control de <span className="text-blue-600 font-bold text-lg">Solución Gym</span>
        </p>
      </div>

      {/* 📊 SECCIÓN DE MÉTRICAS (AHORA SON ENLACES CLICABLES) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Reportes" 
          value={stats.reports} 
          icon={<FileText className="text-blue-600" />} 
          bgColor="bg-blue-50" 
          href="/dashboard/mantenimiento" // 👈 Redirige a mantenimiento
        />
        <StatCard 
          title="Clientes" 
          value={stats.clients} 
          icon={<Users className="text-emerald-600" />} 
          bgColor="bg-emerald-50"
          href="/dashboard/clientes" // 👈 Redirige a clientes
        />
        <StatCard 
          title="Equipos" 
          value={stats.machines} 
          icon={<Monitor className="text-amber-600" />} 
          bgColor="bg-amber-50" 
          href="/dashboard/equipos" // 👈 Redirige a equipos
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: ACCIONES */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 px-1">
            Accesos Rápidos
          </h3>
          
          {/* BOTÓN NUEVO REPORTE */}
          <Link href="/dashboard/mantenimiento?nuevo=true" className="group block p-6 bg-slate-900 rounded-3xl shadow-xl hover:bg-blue-700 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/10 p-3 rounded-2xl text-white group-hover:bg-white/20 transition-colors">
                <Plus size={24} />
              </div>
              <ArrowRight className="text-slate-500 group-hover:text-white transition-colors" />
            </div>
            <h4 className="text-white font-bold text-lg">Nuevo Reporte</h4>
            <p className="text-slate-400 text-sm mt-1 group-hover:text-blue-50">Genera un informe técnico ahora.</p>
          </Link>

          <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-xl font-black text-blue-600 uppercase">
                {user.firstName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{nombreCompleto}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: ÚLTIMA ACTIVIDAD */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-slate-800">Mantenimientos Recientes</h3>
            <Link href="/dashboard/mantenimiento" className="text-blue-600 text-xs font-bold hover:underline uppercase tracking-tighter">
              Ver todo
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {latestReports.length === 0 ? (
              <div className="p-16 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                   <ClipboardCheck size={32} />
                </div>
                <p className="text-slate-400 font-bold italic">No hay reportes todavía</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {latestReports.map((report: any) => (
                  // 🛡️ Cambio: Añadimos ?reporteId= a la URL para que la página de mantenimiento sepa cuál abrir
                  <Link 
                    href={`/dashboard/mantenimiento?reporteId=${report.id}`} 
                    key={report.id} 
                    className="block p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ClipboardCheck size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                        {report.client?.name || "Cliente Desconocido"}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                        <Calendar size={12} className="text-blue-400" /> 
                        {new Date(report.date).toLocaleDateString()}
                        <span className="text-slate-200">|</span>
                        <span>Folio #{report.reportNumber}</span>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-200 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componente actualizado: Ahora acepta "href" y es un componente <Link>
function StatCard({ title, value, icon, bgColor, href }: { title: string, value: number, icon: React.ReactNode, bgColor: string, href: string }) {
  return (
    <Link href={href} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md hover:-translate-y-1 group cursor-pointer block">
      <div className={`${bgColor} p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tighter">{value}</p>
      </div>
    </Link>
  );
}
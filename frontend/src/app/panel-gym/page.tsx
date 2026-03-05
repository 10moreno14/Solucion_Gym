import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  Wallet, 
  QrCode, 
  CalendarDays,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { API_URL } from "@/config";

export default async function PanelGymPage() {
  const { userId, orgId, getToken } = await auth();
  const user = await currentUser();

  if (!userId || !user) redirect("/");
  const token = await getToken();

  // 1. LA LLAVE MAESTRA: Priorizamos la organización sobre el usuario personal
  const tenantId = orgId || userId;

  // 2. CONSTRUCCIÓN DEL NOMBRE: Para que el backend personalice el Gimnasio
  const fullName = `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;

  let stats = { activeAffiliates: 0, monthlyIncome: 0, todayAccesses: 0 };
  let expiringMemberships: any[] = [];

  try {
    // 3. FETCH ACTUALIZADO: Enviamos el tenantId como clerkId
    // Nota: Mantenemos el nombre del parámetro clerkId para compatibilidad con el backend, pero le pasamos el tenantId (que puede ser el orgId)
    const res = await fetch(
      `${API_URL}/get-gym-dashboard?clerkId=${tenantId}&orgId=${orgId || ''}&fullName=${encodeURIComponent(fullName)}`, 
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      }
    );
    
    const text = await res.text();
    
    if (res.ok && text && text.trim().length > 0) {
      const data = JSON.parse(text);
      if (data.status === 'success') {
        stats = data.stats || stats;
        expiringMemberships = data.expiringMemberships || [];
      }
    } else {
      console.warn(`[Dashboard] Sin datos para el ID: ${tenantId}`);
    }
  } catch (error) {
    console.error("Error crítico cargando dashboard:", error);
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* ENCABEZADO PERSONALIZADO */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          ¡Hola, {user.firstName}! 👋
        </h2>
        <p className="text-slate-500 font-medium tracking-tight">
          Resumen operativo de <span className="text-emerald-600 font-bold text-lg">
            {orgId ? "Tu Organización" : `Gimnasio de ${user.firstName}`}
          </span>
        </p>
      </div>

      {/* 📊 TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Afiliados Activos" 
          value={stats.activeAffiliates} 
          icon={<Users className="text-blue-600" />} 
          bgColor="bg-blue-50" 
          href="/panel-gym/afiliados" 
        />
        <StatCard 
          title="Ingresos del Mes" 
          value={`$${stats.monthlyIncome.toLocaleString()}`} 
          icon={<Wallet className="text-emerald-600" />} 
          bgColor="bg-emerald-50" 
          href="/panel-gym/caja" 
        />
        <StatCard 
          title="Accesos Hoy" 
          value={stats.todayAccesses} 
          icon={<QrCode className="text-amber-600" />} 
          bgColor="bg-amber-50" 
          href="/panel-gym/accesos" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: ALERTAS DE COBRO */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="text-rose-500" size={20} />
              Renovaciones Próximas (7 días)
            </h3>
            <span className="text-xs font-black bg-rose-100 text-rose-600 px-3 py-1 rounded-full uppercase tracking-widest">
              {expiringMemberships.length} por cobrar
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {expiringMemberships.length === 0 ? (
              <div className="p-16 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                   <CalendarDays size={32} />
                </div>
                <p className="text-slate-400 font-bold">¡Todo al día!</p>
                <p className="text-xs text-slate-400 mt-1">No hay membresías por vencer esta semana.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expiringMemberships.map((memb: any) => (
                  <div key={memb.id} className="p-5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className="bg-rose-50 p-3 rounded-xl text-rose-500 shadow-inner font-black text-xl">
                      {memb.endDate ? new Date(memb.endDate).getDate() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {memb.affiliate?.fullName || "Cliente Desconocido"}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{memb.plan?.name}</span>
                        <span>|</span>
                        <span>Vence: {memb.endDate ? new Date(memb.endDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <Link href={`https://wa.me/57${memb.affiliate?.phone}`} target="_blank" className="text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-xs font-black px-4 py-2 rounded-lg transition-colors uppercase tracking-widest">
                      Cobrar
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: ACCESOS RÁPIDOS */}
        <div className="space-y-6">
          <h3 className="font-bold text-slate-800 px-1">Accesos Rápidos</h3>
          
          <Link href="/panel-gym/accesos" className="group block p-6 bg-emerald-600 rounded-3xl shadow-xl hover:bg-emerald-700 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-white/20 p-3 rounded-2xl text-white group-hover:bg-white/30 transition-colors">
                <QrCode size={24} />
              </div>
              <ArrowRight className="text-emerald-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-white font-black text-xl uppercase tracking-tight">Recepción</h4>
            <p className="text-emerald-100 text-sm mt-1 font-medium">Ir al validador de entradas</p>
          </Link>

          <Link href="/panel-gym/afiliados" className="group block p-6 bg-white border border-slate-200 rounded-3xl hover:border-emerald-300 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-slate-50 p-3 rounded-2xl text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <Users size={24} />
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </div>
            <h4 className="text-slate-800 font-black text-lg">Nuevo Afiliado</h4>
            <p className="text-slate-500 text-xs mt-1 font-medium">Registrar a un nuevo cliente</p>
          </Link>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, href }: { title: string, value: string | number, icon: React.ReactNode, bgColor: string, href: string }) {
  return (
    <Link href={href} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md hover:-translate-y-1 group cursor-pointer block">
      <div className={`${bgColor} p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="overflow-hidden">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1 truncate">{title}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tighter truncate">{value}</p>
      </div>
    </Link>
  );
}
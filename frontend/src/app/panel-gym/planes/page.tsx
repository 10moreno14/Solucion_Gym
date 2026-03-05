"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Search, Edit2, Loader2, Dumbbell, Archive, CheckCircle2, Trash2 } from "lucide-react"; 
import PlanDrawer from "@/components/PlanDrawer";
import { API_URL } from "@/config";

interface Plan {
  id: string;
  name: string;
  price: string;
  durationDays: number;
  description: string;
  status: string;
}

export default function PlanesPage() {
  // 🌟 1. EXTRAEMOS orgId Y DEFINIMOS EL tenantId
  const { getToken, userId, orgId } = useAuth();
  const tenantId = orgId || userId;

  const [planes, setPlanes] = useState<Plan[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [planEditar, setPlanEditar] = useState<Plan | null>(null);

  const fetchPlanes = async () => {
    if (!tenantId) return; // 👈 Usamos tenantId
    try {
      const token = await getToken();
      // 🌟 2. MANDAMOS EL tenantId AL BACKEND
      const res = await fetch(`${API_URL}/get-plans?clerkId=${tenantId}&orgId=${orgId || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlanes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar planes:", error);
    } finally {
      setCargando(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nuevoEstado = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const accion = nuevoEstado === 'ACTIVE' ? 'activar' : 'archivar';
    
    if (!confirm(`¿Estás seguro de ${accion} este plan?`)) return;

    try {
      const token = await getToken();
      await fetch(`${API_URL}/toggle-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // 🌟 3. ENVIAMOS EL tenantId PARA CAMBIAR EL ESTADO
        body: JSON.stringify({ id, status: nuevoEstado, clerkId: tenantId }),
      });
      fetchPlanes();
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  const eliminarPlan = async (id: string) => {
    if (!confirm("¿Estás seguro de ELIMINAR definitivamente este plan? Si ya tiene membresías vendidas, el sistema no te dejará borrarlo.")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/delete-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // 🌟 4. ENVIAMOS EL tenantId PARA ELIMINAR
        body: JSON.stringify({ id, clerkId: tenantId }),
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        fetchPlanes();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error("Error eliminando plan:", error);
      alert("Ocurrió un error al intentar eliminar el plan.");
    }
  };

  useEffect(() => { 
    // 🌟 5. EL EFECTO DEPENDE DEL tenantId
    if (tenantId) fetchPlanes(); 
  }, [tenantId]);

  const filtrados = planes.filter(p => p.name.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Dumbbell className="text-emerald-600" size={32} />
            PLANES DE MEMBRESÍA
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Configura los productos y tarifas de tu gimnasio.
          </p>
        </div>
        <button 
          onClick={() => { setPlanEditar(null); setIsDrawerOpen(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 tracking-widest uppercase"
        >
          <Plus size={20} /> Nuevo Plan
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="relative group">
        <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Buscar plan por nombre..."
          className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-base transition-all font-bold text-slate-800"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
          <p className="font-bold tracking-widest uppercase text-sm">Cargando planes...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
          <Dumbbell className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-xl font-black text-slate-800">No hay planes configurados</h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">Crea tu primer plan para empezar a afiliar clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((plan) => {
            const isActivo = plan.status === 'ACTIVE';
            
            return (
              <div 
                key={plan.id} 
                className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-xl transition-all group relative ${isActivo ? 'border-slate-200 hover:border-emerald-200' : 'border-slate-200 opacity-60 grayscale'}`}
              >
                {/* Etiqueta de Estado */}
                <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-md ${isActivo ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                  {isActivo ? 'Activo' : 'Archivado'}
                </div>

                <div className="flex justify-between items-start mb-6 mt-2">
                  <div className={`p-4 rounded-2xl shadow-inner transition-colors ${isActivo ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Dumbbell size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => { setPlanEditar(plan); setIsDrawerOpen(true); }}
                      className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Editar plan"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => toggleStatus(plan.id, plan.status)}
                      className={`p-2.5 rounded-xl transition-all ${isActivo ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      title={isActivo ? "Archivar Plan" : "Reactivar Plan"}
                    >
                      {isActivo ? <Archive size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                    <button 
                      onClick={() => eliminarPlan(plan.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-slate-800 leading-tight truncate">
                    {plan.name}
                  </h3>
                  <div className="flex items-end gap-1 text-emerald-600 pt-2">
                     <span className="text-3xl font-black tracking-tighter">${Number(plan.price).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm font-bold bg-slate-50 p-3 rounded-xl">
                    <span className="text-slate-400 uppercase tracking-widest text-[10px]">Duración:</span>
                    <span className="text-slate-800">{plan.durationDays} Días</span>
                  </div>
                  {plan.description && (
                    <p className="text-xs font-medium text-slate-500 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cajón lateral para Crear/Editar */}
      <PlanDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={fetchPlanes}
        planEditar={planEditar}
      />
    </div>
  );
}
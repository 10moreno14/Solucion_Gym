"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs"; // 👈 Hook de Clerk
import { Plus, Search, Edit2, Loader2, Users, UserX, UserCheck, Phone, CreditCard, Trash2, Download, ListOrdered } from "lucide-react"; 
import AfiliadoDrawer from "@/components/AfiliadoDrawer";
import MembresiaDrawer from "@/components/MembresiaDrawer"; 
import { API_URL } from "@/config";
import * as XLSX from 'xlsx';

interface Afiliado {
  id: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  status: string;
  photoUrl?: string; 
  hasActivePlan?: boolean;
  expirationDate?: string | null; 
}

export default function AfiliadosPage() {
  // 🌟 1. EXTRAEMOS EL orgId
  const { getToken, userId, orgId } = useAuth();
  
  // 🌟 2. DEFINIMOS LA LLAVE MAESTRA (Prioriza la empresa sobre el usuario)
  const tenantId = orgId || userId;

  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [limite, setLimite] = useState(10); 
  const [cargando, setCargando] = useState(true);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [afiliadoEditar, setAfiliadoEditar] = useState<Afiliado | null>(null);
  
  const [isMembresiaOpen, setIsMembresiaOpen] = useState(false);
  const [afiliadoParaMembresia, setAfiliadoParaMembresia] = useState<Afiliado | null>(null);

  const fetchAfiliados = async () => {
    if (!tenantId) return; // 👈 Usamos tenantId
    try {
      const token = await getToken();
      // 🌟 3. ENVIAMOS EL tenantId AL BACKEND
      // Nota: Si tu backend sigue esperando la palabra "clerkId", le mandamos el tenantId ahí.
      const res = await fetch(`${API_URL}/get-affiliates?clerkId=${tenantId}&orgId=${orgId || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAfiliados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar afiliados:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleExport = () => {
    if (afiliados.length === 0) return alert("No hay afiliados para exportar");

    const datosExcel = afiliados.map(a => ({
      "Nombre Completo": a.fullName,
      "Tipo Doc": a.documentType,
      "Documento": a.documentNumber,
      "Teléfono": a.phone || 'No registrado',
      "Estado Perfil": a.status === 'ACTIVE' ? 'ACTIVO' : 'BLOQUEADO',
      "¿Plan Vigente?": a.hasActivePlan ? 'SÍ' : 'NO / VENCIDO',
      "Plan Vigente Hasta": a.expirationDate 
        ? new Date(a.expirationDate).toLocaleDateString('es-CO') 
        : 'N/A'
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Afiliados");

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Directorio_Afiliados_${fecha}.xlsx`);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nuevoEstado = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const accion = nuevoEstado === 'ACTIVE' ? 'reactivar' : 'inactivar';
    
    if (!confirm(`¿Estás seguro de ${accion} a este afiliado?`)) return;

    try {
      const token = await getToken();
      await fetch(`${API_URL}/toggle-affiliate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // 🌟 4. ENVIAMOS EL tenantId PARA LA ACTUALIZACIÓN
        body: JSON.stringify({ id, status: nuevoEstado, clerkId: tenantId }),
      });
      fetchAfiliados();
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  const eliminarAfiliado = async (id: string) => {
    if (!confirm("¿Estás seguro de ELIMINAR definitivamente este afiliado?")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/delete-affiliate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // 🌟 5. ENVIAMOS EL tenantId PARA LA ELIMINACIÓN
        body: JSON.stringify({ id, clerkId: tenantId }),
      });
      if (res.ok) fetchAfiliados();
    } catch (error) {
      console.error("Error eliminando afiliado:", error);
    }
  };

  useEffect(() => { 
    // 🌟 6. EL EFECTO AHORA DEPENDE DEL tenantId COMPARTIDO
    if (tenantId) fetchAfiliados(); 
  }, [tenantId]);

  // Lógica de filtrado por búsqueda
  const filtrados = afiliados.filter(a => {
    const termino = busqueda.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(termino) ||
      (a.documentNumber && a.documentNumber.includes(termino)) ||
      (a.phone && a.phone.includes(termino))
    );
  });

  const visibles = filtrados.slice(0, limite);

  return (
    <div className="space-y-6 pb-10">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="text-emerald-600" size={32} />
            DIRECTORIO DE AFILIADOS
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Gestiona la información de tus clientes.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-4 rounded-2xl font-black shadow-sm hover:bg-slate-50 transition-all active:scale-95 tracking-widest uppercase text-xs"
          >
            <Download size={18} /> Exportar
          </button>

          <button 
            onClick={() => { setAfiliadoEditar(null); setIsDrawerOpen(true); }}
            className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 tracking-widest uppercase text-xs"
          >
            <Plus size={20} /> Registrar Afiliado
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA + SELECTOR DE LÍMITE */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre, documento o celular..."
            className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-base transition-all font-bold text-slate-800"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {/* SELECTOR DE CANTIDAD A MOSTRAR */}
        <div className="w-full md:w-auto flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
           <ListOrdered size={20} className="text-slate-400" />
           <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Ver:</span>
           <select 
             value={limite}
             onChange={(e) => setLimite(Number(e.target.value))}
             className="bg-slate-100 font-black text-slate-800 rounded-lg px-3 py-1 outline-none"
           >
             <option value={10}>10</option>
             <option value={20}>20</option>
             <option value={30}>30</option>
             <option value={filtrados.length}>Todos</option>
           </select>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
          <p className="font-bold tracking-widest uppercase text-sm">Cargando base de datos...</p>
        </div>
      ) : visibles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
          <Users className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-xl font-black text-slate-800">No hay resultados</h3>
          <p className="text-sm text-slate-500 mt-2 font-medium">Registra un afiliado o ajusta tu búsqueda.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibles.map((afiliado) => {
              const isPerfilActivo = afiliado.status === 'ACTIVE'; 
              const tienePlan = afiliado.hasActivePlan; 

              let badgeText = "";
              let badgeColor = "";

              if (!isPerfilActivo) {
                badgeText = "BLOQUEADO";
                badgeColor = "bg-red-600";
              } else if (tienePlan) {
                badgeText = "PLAN ACTIVO";
                badgeColor = "bg-emerald-500";
              } else {
                badgeText = "SIN PLAN / VENCIDO";
                badgeColor = "bg-amber-500"; 
              }
              
              return (
                <div key={afiliado.id} className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-xl transition-all group relative ${!isPerfilActivo && 'opacity-70 grayscale'}`}>
                  
                  <div className={`absolute -top-3 left-6 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-md ${badgeColor}`}>
                    {badgeText}
                  </div>

                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black uppercase text-white shadow-inner overflow-hidden ${isPerfilActivo ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                      {afiliado.photoUrl ? (
                        <img src={afiliado.photoUrl} alt={afiliado.fullName} className="w-full h-full object-cover" />
                      ) : (
                        afiliado.fullName.charAt(0)
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setAfiliadoEditar(afiliado); setIsDrawerOpen(true); }} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => toggleStatus(afiliado.id, afiliado.status)} className={`p-2.5 rounded-xl transition-all text-slate-400 hover:text-amber-600 hover:bg-amber-50`} title="Cambiar Estado">
                        {isPerfilActivo ? <UserX size={18} /> : <UserCheck size={18} />}
                      </button>
                      <button onClick={() => eliminarAfiliado(afiliado.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <h3 className="text-xl font-extrabold text-slate-800 leading-tight truncate">
                      {afiliado.fullName}
                    </h3>
                    <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                       <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest">{afiliado.documentType}</span>
                       {afiliado.documentNumber}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                         <Phone size={16} />
                      </div>
                      <span className="font-mono text-sm font-bold text-slate-700">{afiliado.phone || 'N/A'}</span>
                    </div>

                    {isPerfilActivo && (
                      <button 
                        onClick={() => { setAfiliadoParaMembresia(afiliado); setIsMembresiaOpen(true); }}
                        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                      >
                        <CreditCard size={14} /> Plan
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
            Viendo {visibles.length} de {filtrados.length} afiliados encontrados
          </div>
        </>
      )}

      {/* Drawers */}
      <AfiliadoDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onSuccess={fetchAfiliados} afiliadoEditar={afiliadoEditar} />
      <MembresiaDrawer isOpen={isMembresiaOpen} onClose={() => setIsMembresiaOpen(false)} onSuccess={() => fetchAfiliados()} afiliado={afiliadoParaMembresia} />
      
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Monitor, Plus, Search, Edit2, Trash2, Loader2, MapPin, Hash } from "lucide-react";
import MaquinaDrawer from "@/components/MaquinaDrawer";
import { API_URL } from "@/config";

interface Maquina {
  id: string;
  clientId: string;
  name: string;
  brand: string;
  model: string;
  serial: string;
  location: string;
  qrCode: string;
  client?: {
    name: string;
  };
}

export default function EquiposPage() {
  const { getToken, userId } = useAuth();
  const [equipos, setEquipos] = useState<Maquina[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [equipoEditar, setEquipoEditar] = useState<Maquina | null>(null);

  const fetchEquipos = async () => {
    if (!userId) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/get-all-machines?clerkId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEquipos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar equipos:", error);
      setEquipos([]);
    } finally {
      setCargando(false);
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Deseas eliminar este equipo?")) return;
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/delete-machine`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });

      const result = await res.json();
      if (result.status !== "success") {
        alert(result.message || "No se pudo eliminar el equipo");
        return;
      }
      fetchEquipos();
    } catch (error) {
      console.error("Error al eliminar equipo:", error);
    }
  };

  useEffect(() => {
    if (userId) fetchEquipos();
  }, [userId]);

  const filtrados = equipos.filter((e) =>
    e.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.client?.name?.toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.serial && e.serial.includes(busqueda))
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Monitor className="text-amber-600" size={32} />
            EQUIPOS
          </h2>
          <p className="text-slate-500 text-sm font-medium">Gestiona las máquinas asignadas a tus clientes.</p>
        </div>
        <button
          onClick={() => { setEquipoEditar(null); setIsDrawerOpen(true); }}
          className="w-full md:w-auto bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={20} /> Nuevo Equipo
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input
          placeholder="Buscar por nombre, cliente o serial..."
          className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-emerald-500 text-base transition-all font-bold text-slate-800"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="font-medium">Cargando inventario...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center">
          <Monitor className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-800">No hay equipos registrados</h3>
          <p className="text-sm text-slate-500 mt-1">Crea tu primer equipo y asígnalo a un cliente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((e) => (
            <div key={e.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Monitor size={24} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setEquipoEditar(e); setIsDrawerOpen(true); }} 
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
                    title="Editar equipo"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => eliminar(e.id)} 
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                    title="Eliminar equipo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-800 truncate leading-tight">{e.name}</h3>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{e.client?.name || "Sin cliente"}</p>

              <div className="mt-5 space-y-2 border-t pt-4 border-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Hash size={14} className="text-slate-300" />
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold tracking-tighter">
                    SN: {e.serial || "---"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} className="text-slate-300" />
                  <span className="truncate">{e.location || "Sin ubicación específica"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                <div className="bg-slate-50 p-2 rounded-lg">Marca: <span className="text-slate-700 block">{e.brand || "---"}</span></div>
                <div className="bg-slate-50 p-2 rounded-lg">Modelo: <span className="text-slate-700 block">{e.model || "---"}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MaquinaDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={fetchEquipos}
        maquinaEditar={equipoEditar}
      />
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Monitor, Plus, Search, Edit2, Trash2, Loader2, MapPin, Hash } from "lucide-react";
import MaquinaDrawer from "@/components/MaquinaDrawer";

// 1. Definimos la interfaz para que TypeScript sepa qué contiene un equipo
interface Maquina {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial: string;
  location: string;
  client?: {
    name: string;
  };
}

export default function EquiposPage() {
  const { getToken, userId } = useAuth();
  
  // 2. Especificamos el tipo en el useState para evitar el error de 'never[]'
  const [equipos, setEquipos] = useState<Maquina[]>([]);
  
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [equipoEditar, setEquipoEditar] = useState<Maquina | null>(null);

  const fetchEquipos = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/get-all-machines?clerkId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      // 3. Ahora setEquipos aceptará los datos correctamente
      setEquipos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar equipos:", error);
      setEquipos([]);
    } finally {
      setCargando(false);
    }
  };

  const eliminar = async (id: string) => {
    if(!confirm("¿Deseas eliminar este equipo?")) return;
    try {
      const token = await getToken();
      await fetch("http://localhost:3000/delete-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Inventario de Equipos</h2>
          <p className="text-slate-500 text-sm font-medium">Gestiona las máquinas de cada sede.</p>
        </div>
        <button onClick={() => { setEquipoEditar(null); setIsDrawerOpen(true); }} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={20} /> Nuevo Equipo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        <input 
          placeholder="Buscar por nombre, gimnasio o serial..."
          className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtrados.map((e) => (
            <div key={e.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-amber-50 p-3 rounded-2xl text-amber-600 shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Monitor size={24} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEquipoEditar(e); setIsDrawerOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={18} /></button>
                  <button onClick={() => eliminar(e.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
              
              <h3 className="text-lg font-black text-slate-800 truncate leading-tight">{e.name}</h3>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{e.client?.name}</p>
              
              <div className="mt-5 space-y-2 border-t pt-4 border-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Hash size={14} className="text-slate-300" />
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold tracking-tighter">SN: {e.serial || '---'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} className="text-slate-300" />
                  <span className="truncate">{e.location || 'Sin ubicación específica'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                <div className="bg-slate-50 p-2 rounded-lg">Marca: <span className="text-slate-700 block">{e.brand || '---'}</span></div>
                <div className="bg-slate-50 p-2 rounded-lg">Modelo: <span className="text-slate-700 block">{e.model || '---'}</span></div>
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
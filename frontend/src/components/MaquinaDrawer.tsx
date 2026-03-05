"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Save, Loader2, Monitor, MapPin, QrCode, Hash } from "lucide-react";
import { API_URL } from "@/config";

interface Cliente {
  id: string;
  name: string;
}

interface Maquina {
  id?: string;
  clientId: string;
  name: string;
  brand: string;
  model: string;
  serial: string;
  location: string;
  qrCode: string;
}

interface MaquinaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  maquinaEditar: Maquina | null;
}

const emptyForm: Maquina = {
  clientId: "",
  name: "",
  brand: "",
  model: "",
  serial: "",
  location: "",
  qrCode: "",
};

export default function MaquinaDrawer({ isOpen, onClose, onSuccess, maquinaEditar }: MaquinaDrawerProps) {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formData, setFormData] = useState<Maquina>(emptyForm);

  useEffect(() => {
    const loadClientes = async () => {
      if (!userId || !isOpen) return;
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/get-clients?clerkId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando clientes:", error);
        setClientes([]);
      }
    };

    loadClientes();

    if (maquinaEditar) {
      setFormData({
        id: maquinaEditar.id,
        clientId: maquinaEditar.clientId || "",
        name: maquinaEditar.name || "",
        brand: maquinaEditar.brand || "",
        model: maquinaEditar.model || "",
        serial: maquinaEditar.serial || "",
        location: maquinaEditar.location || "",
        qrCode: maquinaEditar.qrCode || ""
      });
    } else {
      setFormData(emptyForm);
    }
  }, [isOpen, maquinaEditar, getToken, userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/save-machine`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, clerkId: userId }),
      });

      const result = await res.json();
      if (result.status !== "success") {
        alert(result.message || "No se pudo guardar el equipo");
        return;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />
      )}

      <aside className={`
        fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          
          <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {maquinaEditar ? "EDITAR EQUIPO" : "NUEVO EQUIPO"}
            </h2>
            <button 
              type="button" 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 🛡️ Cambio: text-slate-800 para etiquetas y text-black para los inputs */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Gimnasio / Cliente</label>
              <select 
                required 
                className="w-full p-3 border border-slate-300 rounded-xl mt-1 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-black bg-white"
                value={formData.clientId} 
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              >
                <option value="" className="text-slate-500">Selecciona un gimnasio...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id} className="text-black">{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Nombre del Equipo</label>
              <div className="relative mt-1">
                <Monitor className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  required 
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-black" 
                  placeholder="Ej: Caminadora T90" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Marca</label>
                <input 
                  className="w-full p-3 border border-slate-300 rounded-xl mt-1 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-black" 
                  placeholder="LifeFitness" 
                  value={formData.brand} 
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })} 
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Modelo</label>
                <input 
                  className="w-full p-3 border border-slate-300 rounded-xl mt-1 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-black" 
                  placeholder="2024-X" 
                  value={formData.model} 
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Serial</label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input 
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl font-mono text-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-black" 
                    placeholder="SN-123" 
                    value={formData.serial} 
                    onChange={(e) => setFormData({ ...formData, serial: e.target.value })} 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Cód. QR</label>
                <div className="relative mt-1">
                  <QrCode className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input 
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl font-mono text-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-bold text-black" 
                    placeholder="QR-456" 
                    value={formData.qrCode} 
                    onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Ubicación física</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input 
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-black" 
                  placeholder="Ej: Zona de Cardio, 2do Piso" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 font-bold text-slate-700 hover:bg-slate-200 rounded-2xl transition-all border border-slate-300"
            >
              Cancelar
            </button>
            <button 
              disabled={loading} 
              className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              GUARDAR EQUIPO
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
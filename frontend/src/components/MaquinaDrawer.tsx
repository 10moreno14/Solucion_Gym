"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Save, Loader2, Monitor, MapPin, QrCode, Hash, Tag, Box } from "lucide-react";

interface Maquina {
  id?: string;
  clientId: string;
  name: string;
  brand: string;
  model: string;
  serial: string; // 👈 Cambiado a 'serial'
  location: string; // 👈 Nuevo
  qrCode: string; // 👈 Nuevo
}

export default function MaquinaDrawer({ isOpen, onClose, onSuccess, maquinaEditar }: any) {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [formData, setFormData] = useState<Maquina>({
    clientId: "", name: "", brand: "", model: "", serial: "", location: "", qrCode: ""
  });

  useEffect(() => {
    const loadClientes = async () => {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/get-clients?clerkId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClientes(await res.json());
    };
    if (isOpen) loadClientes();
    if (maquinaEditar) {
      setFormData({
        ...maquinaEditar,
        serial: maquinaEditar.serial || "",
        location: maquinaEditar.location || "",
        qrCode: maquinaEditar.qrCode || ""
      });
    } else {
      setFormData({ clientId: "", name: "", brand: "", model: "", serial: "", location: "", qrCode: "" });
    }
  }, [isOpen, maquinaEditar]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      await fetch("http://localhost:3000/save-machine", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, clerkId: userId }),
      });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm" onClick={onClose} />}
      <aside className={`fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
            <h2 className="text-xl font-black">{maquinaEditar ? 'EDITAR EQUIPO' : 'NUEVO EQUIPO'}</h2>
            <button type="button" onClick={onClose}><X /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Gimnasio / Cliente</label>
              <select required className="w-full p-3 border rounded-xl mt-1" value={formData.clientId} onChange={(e) => setFormData({...formData, clientId: e.target.value})}>
                <option value="">Selecciona un gimnasio...</option>
                {clientes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Nombre del Equipo</label>
              <div className="relative">
                <Monitor className="absolute left-3 top-3 text-slate-300" size={18} />
                <input required className="w-full p-3 pl-10 border rounded-xl" placeholder="Ej: Caminadora T90" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Marca</label>
                <input className="w-full p-3 border rounded-xl" placeholder="LifeFitness" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Modelo</label>
                <input className="w-full p-3 border rounded-xl" placeholder="2024-X" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Serial</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 text-slate-300" size={18} />
                  <input className="w-full p-3 pl-10 border rounded-xl font-mono" placeholder="SN-123" value={formData.serial} onChange={(e) => setFormData({...formData, serial: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Cód. QR (Opcional)</label>
                <div className="relative">
                  <QrCode className="absolute left-3 top-3 text-slate-300" size={18} />
                  <input className="w-full p-3 pl-10 border rounded-xl font-mono" placeholder="QR-456" value={formData.qrCode} onChange={(e) => setFormData({...formData, qrCode: e.target.value})} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Ubicación dentro del Gym</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-300" size={18} />
                <input className="w-full p-3 pl-10 border rounded-xl" placeholder="Ej: Zona de Cardio, 2do Piso" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold">Cancelar</button>
            <button disabled={loading} className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              Guardar Equipo
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
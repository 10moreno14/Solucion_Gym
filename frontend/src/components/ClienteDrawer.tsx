"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Save, Loader2, Building2, MapPin, Phone, Mail, Hash } from "lucide-react";
import { API_URL } from "@/config"; // 👈 Añadido para mantener conectividad centralizada

// Definimos la estructura del objeto Cliente incluyendo el NIT
interface Cliente {
  id?: string;
  name: string;
  nit: string; 
  address: string;
  phone: string;
  email: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clienteEditar: Cliente | null;
}

export default function ClienteDrawer({ isOpen, onClose, onSuccess, clienteEditar }: Props) {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Inicializamos el estado con el campo NIT vacío
  const [formData, setFormData] = useState<Cliente>({
    name: "",
    nit: "", 
    address: "",
    phone: "",
    email: "",
  });

  // Si abrimos para editar, cargamos los datos (incluyendo el NIT)
  useEffect(() => {
    if (clienteEditar) {
      setFormData({
        id: clienteEditar.id,
        name: clienteEditar.name,
        nit: clienteEditar.nit || "",
        address: clienteEditar.address || "",
        phone: clienteEditar.phone || "",
        email: clienteEditar.email || "",
      });
    } else {
      setFormData({ name: "", nit: "", address: "", phone: "", email: "" });
    }
  }, [clienteEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/save-client`, { // 👈 Usamos la API central
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...formData, clerkId: userId }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error al guardar cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay de fondo */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose} />
      )}

      {/* Panel del Drawer */}
      <aside className={`
        fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          
          {/* Cabecera */}
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight"> {/* 👈 Más oscuro */}
                {clienteEditar ? "EDITAR CLIENTE" : "NUEVO CLIENTE"}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                Información del Gimnasio
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-800">
              <X size={20} />
            </button>
          </div>

          {/* Formulario de entrada */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Nombre del Cliente */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Nombre Cliente / Gym</label> {/* 👈 Letras negras */}
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-black" 
                  placeholder="Ej: Power Fitness Center"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Campo NIT (Nuevo) */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">NIT / Identificación Fiscal</label>
              <div className="relative mt-1">
                <Hash className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-black"
                  placeholder="Ej: 900.123.456-1"
                  value={formData.nit}
                  onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Dirección Física</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-black"
                  placeholder="Calle 123 #45-67..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* Teléfono y Correo en fila */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Teléfono</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-black"
                    placeholder="300 123..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Correo</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    type="email"
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-black"
                    placeholder="gym@mail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Botones de acción en el pie */}
          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-700 hover:bg-slate-200 rounded-2xl transition-all border border-slate-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name}
              className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {clienteEditar ? "GUARDAR" : "CREAR CLIENTE"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
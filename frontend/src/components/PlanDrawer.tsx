"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Save, Loader2, Dumbbell, CalendarDays, CircleDollarSign, AlignLeft } from "lucide-react";
import { API_URL } from "@/config";

interface Plan {
  id?: string;
  name: string;
  price: string | number;
  durationDays: string | number;
  description: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planEditar: Plan | null;
}

const emptyForm: Plan = {
  name: "",
  price: "",
  durationDays: 30, // Por defecto 1 mes
  description: "",
  status: "ACTIVE",
};

export default function PlanDrawer({ isOpen, onClose, onSuccess, planEditar }: Props) {
  const { getToken, userId, orgId } = useAuth();
  // 🌟 DEFINIMOS EL tenantId
  const tenantId = orgId || userId;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Plan>(emptyForm);

  useEffect(() => {
    if (planEditar) {
      setFormData({
        id: planEditar.id,
        name: planEditar.name,
        price: planEditar.price,
        durationDays: planEditar.durationDays,
        description: planEditar.description || "",
        status: planEditar.status || "ACTIVE",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [planEditar, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/save-plan`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        // 🌟 ENVIAMOS EL tenantId PARA GUARDAR EL PLAN
        body: JSON.stringify({ ...formData, clerkId: tenantId }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Error al guardar el plan");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose} />
      )}

      <aside className={`
        fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {planEditar ? "EDITAR PLAN" : "NUEVO PLAN"}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                Configuración de Membresía
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-800">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Nombre del Plan */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Nombre del Plan</label>
              <div className="relative mt-1">
                <Dumbbell className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black" 
                  placeholder="Ej: Mensualidad VIP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Precio */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Precio</label>
                <div className="relative mt-1">
                  <CircleDollarSign className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    required
                    type="number"
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black"
                    placeholder="150000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              {/* Duración */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Duración (Días)</label>
                <div className="relative mt-1">
                  <CalendarDays className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    required
                    type="number"
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black"
                    placeholder="30"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Descripción / Beneficios</label>
              <div className="relative mt-1">
                <AlignLeft className="absolute left-3 top-3 text-slate-500" size={18} />
                <textarea
                  rows={3}
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black text-sm"
                  placeholder="Incluye acceso a todas las zonas, clases grupales..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

          </form>

          {/* Botones */}
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
              disabled={loading || !formData.name || !formData.price}
              className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95 tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {planEditar ? "GUARDAR" : "CREAR PLAN"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
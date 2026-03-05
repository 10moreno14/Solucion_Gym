"use client";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Save, Loader2, ArrowDownRight, ArrowUpRight, Tags, AlignLeft, DollarSign } from "lucide-react";
import { API_URL } from "@/config";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransaccionDrawer({ isOpen, onClose, onSuccess }: Props) {
  // 🌟 1. EXTRAEMOS orgId Y DEFINIMOS tenantId
  const { getToken, userId, orgId } = useAuth();
  const tenantId = orgId || userId;

  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    type: "EXPENSE", 
    category: "",
    amount: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/save-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // 🌟 2. ENVIAMOS EL tenantId PARA GUARDAR LA TRANSACCIÓN
        body: JSON.stringify({ clerkId: tenantId, ...formData }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
        setFormData({ type: "EXPENSE", category: "", amount: "", description: "" });
      }
    } catch (error) {
      console.error("Error al guardar transacción:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose} />}

      <aside className={`fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-full flex flex-col">
          
          <div className={`p-6 border-b flex justify-between items-center text-white ${formData.type === 'INCOME' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase">NUEVA TRANSACCIÓN</h2>
              <p className="text-xs font-bold uppercase tracking-widest mt-1 opacity-80">
                Registro manual en caja
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/20 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Tipo (Ingreso / Egreso) */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "INCOME" })}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-black tracking-widest uppercase transition-all ${
                  formData.type === "INCOME" ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-slate-200 text-slate-400 hover:bg-slate-50"
                }`}
              >
                <ArrowUpRight size={24} /> Ingreso
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "EXPENSE" })}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-black tracking-widest uppercase transition-all ${
                  formData.type === "EXPENSE" ? "border-rose-500 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-400 hover:bg-slate-50"
                }`}
              >
                <ArrowDownRight size={24} /> Gasto
              </button>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Categoría / Concepto</label>
              <div className="relative mt-1">
                <Tags className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all font-bold text-black" 
                  placeholder={formData.type === 'EXPENSE' ? "Ej: Servicios, Limpieza, Salarios..." : "Ej: Bebidas, Suplementos..."}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            {/* Monto */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Monto</label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  type="number"
                  className={`w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 outline-none transition-all font-black text-lg ${
                    formData.type === 'INCOME' ? 'focus:ring-emerald-500/20 focus:border-emerald-500 text-emerald-600' : 'focus:ring-rose-500/20 focus:border-rose-500 text-rose-600'
                  }`}
                  placeholder="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Descripción (Opcional)</label>
              <div className="relative mt-1">
                <AlignLeft className="absolute left-3 top-3 text-slate-500" size={18} />
                <textarea
                  rows={3}
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 outline-none transition-all font-bold text-black text-sm"
                  placeholder="Detalles adicionales..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

          </form>

          {/* Botones */}
          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-700 hover:bg-slate-200 rounded-2xl transition-all border border-slate-300">
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading || !formData.amount || !formData.category} 
              className={`flex-[2] text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 tracking-widest shadow-lg ${
                formData.type === 'INCOME' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'
              }`}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              REGISTRAR
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
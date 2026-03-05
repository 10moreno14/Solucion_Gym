"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Save, Loader2, Dumbbell, CalendarDays, CreditCard, Info, AlertCircle } from "lucide-react";
import { API_URL } from "@/config";

interface MembresiaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  afiliado: any | null; 
}

export default function MembresiaDrawer({ isOpen, onClose, onSuccess, afiliado }: MembresiaDrawerProps) {
  // 🌟 CAMBIO CLAVE: Extraemos orgId y definimos el tenantId
  const { getToken, userId, orgId } = useAuth();
  const tenantId = orgId || userId;

  const [loading, setLoading] = useState(false);
  const [planes, setPlanes] = useState<any[]>([]);
  
  const [statusAfiliado, setStatusAfiliado] = useState<{ hasActivePlan: boolean, endDate: string | null } | null>(null);
  
  const [formData, setFormData] = useState({
    planId: "",
    startDate: new Date().toISOString().split('T')[0], 
    pricePaid: ""
  });

  useEffect(() => {
    // 🌟 Usamos tenantId en la dependencia
    if (isOpen && tenantId && afiliado) {
      const fetchData = async () => {
        const token = await getToken();
        
        // 1. Cargar Planes usando el tenantId
        const resPlanes = await fetch(`${API_URL}/get-plans?clerkId=${tenantId}`, { headers: { Authorization: `Bearer ${token}` } });
        const dataPlanes = await resPlanes.json();
        setPlanes(dataPlanes.filter((p: any) => p.status === 'ACTIVE'));

        // 2. Consultar estado actual del cliente usando el tenantId
        const resStatus = await fetch(`${API_URL}/get-affiliate-status?clerkId=${tenantId}&memberId=${afiliado.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const dataStatus = await resStatus.json();
        setStatusAfiliado(dataStatus);
      };
      
      fetchData();
      setFormData({ planId: "", startDate: new Date().toISOString().split('T')[0], pricePaid: "" });
    }
  }, [isOpen, tenantId, afiliado]); // 🌟 Actualizamos la dependencia

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPlanId = e.target.value;
    const plan = planes.find(p => p.id === selectedPlanId);
    setFormData({
      ...formData,
      planId: selectedPlanId,
      pricePaid: plan ? plan.price : "" 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!afiliado) return;
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/save-membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          // 🌟 Enviamos el tenantId como clave maestra
          clerkId: tenantId, 
          memberId: afiliado.id, 
          ...formData 
        }),
      });

      if (res.ok) {
        alert("¡Venta registrada con éxito!");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error al vender:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!afiliado) return null;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose} />}

      <aside className={`fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-full flex flex-col">
          
          <div className="p-6 border-b flex justify-between items-center bg-emerald-600 text-white">
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase">VENDER MEMBRESÍA</h2>
              <p className="text-xs font-bold uppercase tracking-widest mt-1 text-emerald-200">
                Cliente: {afiliado.fullName}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-emerald-700 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            
            {statusAfiliado && (
              <div className={`p-4 rounded-2xl mb-6 border-2 flex items-start gap-3 transition-all ${
                statusAfiliado.hasActivePlan 
                  ? 'bg-blue-50 border-blue-200 text-blue-800' 
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                {statusAfiliado.hasActivePlan ? <Info className="text-blue-500 mt-0.5" size={20} /> : <AlertCircle className="text-slate-400 mt-0.5" size={20} />}
                <div>
                  <p className="font-bold text-sm leading-tight">
                    {statusAfiliado.hasActivePlan 
                      ? `El cliente tiene un plan vigente hasta el ${new Date(statusAfiliado.endDate!).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}.` 
                      : "El cliente actualmente NO tiene un plan vigente."}
                  </p>
                  {statusAfiliado.hasActivePlan && (
                    <p className="text-xs mt-1.5 opacity-80 font-medium">
                      Si compras hoy, el nuevo plan se sumará y arrancará automáticamente a partir de esta fecha.
                    </p>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Selección de Plan */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Seleccionar Plan</label>
                <div className="relative mt-1">
                  <Dumbbell className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <select
                    required
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black appearance-none bg-white"
                    value={formData.planId}
                    onChange={handlePlanChange}
                  >
                    <option value="">-- Elige un plan --</option>
                    {planes.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.durationDays} días) - ${Number(p.price).toLocaleString()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha de Inicio */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Fecha de Registro</label>
                <div className="relative mt-1">
                  <CalendarDays className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    required
                    type="date"
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-500 bg-slate-50"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Total a Pagar */}
              <div>
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Monto Pagado (Permite descuento)</label>
                <div className="relative mt-1">
                  <CreditCard className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    required
                    type="number"
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-black text-emerald-600 text-lg"
                    placeholder="0"
                    value={formData.pricePaid}
                    onChange={(e) => setFormData({ ...formData, pricePaid: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">
                  * Este valor ingresará automáticamente a la caja de hoy.
                </p>
              </div>

            </form>
          </div>

          {/* Botones */}
          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-700 hover:bg-slate-200 rounded-2xl transition-all border border-slate-300">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading || !formData.planId} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95 tracking-widest">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              REGISTRAR PAGO
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
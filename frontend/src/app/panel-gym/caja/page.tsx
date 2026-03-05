"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Plus, Wallet, ArrowUpRight, ArrowDownRight, Loader2, Calendar, Trash2, Download } from "lucide-react"; 
import TransaccionDrawer from "@/components/TransaccionDrawer";
import { API_URL } from "@/config";
import * as XLSX from 'xlsx'; 

interface Transaccion {
  id: string;
  type: string;
  category: string;
  amount: string;
  description: string;
  date: string;
}

export default function CajaPage() {
  // 🌟 1. EXTRAEMOS orgId Y DEFINIMOS tenantId
  const { getToken, userId, orgId } = useAuth();
  const tenantId = orgId || userId;

  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTransacciones = async () => {
    if (!tenantId) return; // 👈 Usamos tenantId
    try {
      const token = await getToken();
      // 🌟 2. MANDAMOS EL tenantId AL BACKEND
      const res = await fetch(`${API_URL}/get-transactions?clerkId=${tenantId}&orgId=${orgId || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTransacciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar transacciones:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleExport = () => {
    if (transacciones.length === 0) return alert("No hay datos para exportar");

    const datosExcel = transacciones.map(t => ({
      Fecha: new Date(t.date).toLocaleDateString('es-CO'),
      Hora: new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Tipo: t.type === 'INCOME' ? 'INGRESO' : 'GASTO',
      Categoría: t.category,
      Monto: Number(t.amount),
      Descripción: t.description || 'Sin descripción'
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos de Caja");

    const fechaActual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Reporte_Caja_${fechaActual}.xlsx`);
  };

  const eliminarTransaccion = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta transacción? Esta acción ajustará automáticamente tu balance neto.")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/delete-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // 🌟 3. ENVIAMOS EL tenantId PARA ELIMINAR LA TRANSACCIÓN
        body: JSON.stringify({ id, clerkId: tenantId }),
      });
      
      const data = await res.json();
      
      if (data.status === 'success') {
        fetchTransacciones();
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      console.error("Error eliminando transacción:", error);
      alert("Ocurrió un error al intentar eliminar la transacción.");
    }
  };

  useEffect(() => { 
    // 🌟 4. EL EFECTO DEPENDE DEL tenantId
    if (tenantId) fetchTransacciones(); 
  }, [tenantId]);

  const ingresos = transacciones.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const egresos = transacciones.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = ingresos - egresos;

  return (
    <div className="space-y-6 pb-10">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Wallet className="text-emerald-600" size={32} />
            FLUJO DE CAJA
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Control de ingresos por membresías y registro de gastos.
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
            onClick={() => setIsDrawerOpen(true)}
            className="flex-[2] md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-slate-300 hover:bg-slate-800 transition-all active:scale-95 tracking-widest uppercase text-xs"
          >
            <Plus size={20} /> Nueva Transacción
          </button>
        </div>
      </div>

      {/* RESUMEN FINANCIERO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
          <p className="text-emerald-600/80 font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowUpRight size={14}/> Total Ingresos</p>
          <p className="text-3xl font-black text-emerald-600 tracking-tighter">${ingresos.toLocaleString()}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl">
          <p className="text-rose-600/80 font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowDownRight size={14}/> Total Gastos</p>
          <p className="text-3xl font-black text-rose-600 tracking-tighter">${egresos.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-3xl border ${balance >= 0 ? 'bg-slate-900 border-slate-800 text-white' : 'bg-red-900 border-red-800 text-white'}`}>
          <p className="text-white/60 font-black text-[10px] uppercase tracking-widest mb-1">Balance Neto</p>
          <p className="text-3xl font-black tracking-tighter">${balance.toLocaleString()}</p>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
           <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Historial de Movimientos</h3>
        </div>
        
        {cargando ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={32} />
            <p className="font-bold uppercase tracking-widest text-xs">Cargando caja...</p>
          </div>
        ) : transacciones.length === 0 ? (
          <div className="p-16 text-center">
            <Wallet className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold">No hay movimientos registrados.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transacciones.map((t) => (
              <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {t.type === 'INCOME' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase tracking-tight">{t.category}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-bold">
                      <Calendar size={12} />
                      {new Date(t.date).toLocaleDateString()} - {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {t.description && <p className="text-xs text-slate-500 mt-1 max-w-sm truncate">{t.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`font-black text-xl tracking-tighter ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}${Number(t.amount).toLocaleString()}
                  </div>
                  <button 
                    onClick={() => eliminarTransaccion(t.id)}
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Eliminar transacción"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <TransaccionDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onSuccess={fetchTransacciones} />
    </div>
  );
}
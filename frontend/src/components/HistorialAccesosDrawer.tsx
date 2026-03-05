"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Loader2, Calendar, Search, QrCode, Download } from "lucide-react"; 
import { API_URL } from "@/config";
import * as XLSX from 'xlsx'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistorialAccesosDrawer({ isOpen, onClose }: Props) {
  // 🌟 1. EXTRAEMOS orgId Y DEFINIMOS tenantId
  const { getToken, userId, orgId } = useAuth();
  const tenantId = orgId || userId;

  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState("");

  const fetchHistorialCompleto = async (dateFilter?: string) => {
    if (!tenantId) return; // 👈 Usamos tenantId
    setLoading(true);
    try {
      const token = await getToken();
      // 🌟 2. MANDAMOS EL tenantId AL BACKEND
      let url = `${API_URL}/get-all-accesses?clerkId=${tenantId}&orgId=${orgId || ''}`;
      if (dateFilter) url += `&date=${dateFilter}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setHistorial(data);
    } catch (error) {
      console.error("Error cargando historial completo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHistorialCompleto(fechaFiltro);
  // 🌟 3. ACTUALIZAMOS DEPENDENCIAS
  }, [isOpen, fechaFiltro, tenantId]); 

  const handleExport = () => {
    if (historial.length === 0) return alert("No hay datos para exportar");

    const datosExcel = historial.map(acceso => ({
      Nombre: acceso.affiliate?.fullName || 'Desconocido',
      Documento: acceso.affiliate?.documentNumber || 'N/A',
      Fecha: new Date(acceso.accessTime).toLocaleDateString('es-CO'),
      Hora: new Date(acceso.accessTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Estado: acceso.status === 'ALLOWED' ? 'PERMITIDO' : 'DENEGADO'
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Accesos");

    const nombreArchivo = fechaFiltro 
      ? `Accesos_Gym_${fechaFiltro}.xlsx` 
      : `Historial_General_Accesos.xlsx`;

    XLSX.writeFile(wb, nombreArchivo);
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose} />}

      <aside className={`fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="h-full flex flex-col">
          
          <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                <QrCode size={20} className="text-emerald-400" />
                Auditoría de Accesos
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest mt-1 text-slate-400">
                Historial completo del sistema
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-300">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 border-b bg-slate-50 space-y-4">
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Calendar size={14} /> Filtrar por fecha
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                  value={fechaFiltro}
                  onChange={(e) => setFechaFiltro(e.target.value)}
                />
                {fechaFiltro && (
                  <button 
                    onClick={() => setFechaFiltro("")}
                    className="px-4 bg-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-300 transition-colors text-sm uppercase tracking-widest"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            <button 
              onClick={handleExport}
              disabled={historial.length === 0 || loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95"
            >
              <Download size={16} /> Descargar Reporte Excel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <Loader2 className="animate-spin text-emerald-600 mb-2" size={32} />
                <span className="text-xs font-bold tracking-widest uppercase">Buscando registros...</span>
              </div>
            ) : historial.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Search className="mx-auto mb-3 opacity-50" size={40} />
                <p className="font-bold">No hay registros para esta fecha.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {historial.map((acceso) => (
                  <div key={acceso.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-black text-slate-800 truncate">{acceso.affiliate?.fullName || 'Desconocido'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase tracking-widest">
                          {acceso.affiliate?.documentNumber}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(acceso.accessTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        acceso.status === 'ALLOWED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {acceso.status === 'ALLOWED' ? 'Permitido' : 'Denegado'}
                      </span>
                      <span className="text-xs font-black text-slate-600">
                        {new Date(acceso.accessTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
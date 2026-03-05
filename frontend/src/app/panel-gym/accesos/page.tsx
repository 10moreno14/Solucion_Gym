"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Search, Loader2, CheckCircle, XCircle, Clock, QrCode, History } from "lucide-react"; 
import HistorialAccesosDrawer from "@/components/HistorialAccesosDrawer"; 
import { API_URL } from "@/config";

interface Acceso {
  id: string;
  accessTime: string;
  status: string;
  affiliate: {
    fullName: string;
    documentNumber: string;
  };
}

export default function AccesosPage() {
  // 🌟 1. EXTRAEMOS orgId Y DEFINIMOS tenantId
  const { getToken, userId, orgId } = useAuth();
  const tenantId = orgId || userId;

  const [documento, setDocumento] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [resultado, setResultado] = useState<{ tipo: 'ALLOWED' | 'DENIED' | 'ERROR', mensaje: string, nombre?: string } | null>(null);
  
  const [historial, setHistorial] = useState<Acceso[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isHistorialOpen, setIsHistorialOpen] = useState(false);

  const fetchHistorial = async () => {
    if (!tenantId) return; // 👈 Usamos tenantId
    try {
      const token = await getToken();
      // 🌟 2. MANDAMOS EL tenantId PARA CARGAR EL HISTORIAL DE HOY
      const res = await fetch(`${API_URL}/get-recent-accesses?clerkId=${tenantId}&orgId=${orgId || ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHistorial(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  useEffect(() => { 
    // 🌟 3. EL EFECTO AHORA DEPENDE DEL tenantId
    if (tenantId) fetchHistorial(); 
    inputRef.current?.focus();
  }, [tenantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento.trim()) return;

    setLoading(true);
    setResultado(null);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/verify-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // 🌟 4. ENVIAMOS EL tenantId PARA VALIDAR EL ACCESO
        body: JSON.stringify({ clerkId: tenantId, documentNumber: documento.trim() }),
      });

      const data = await res.json();

      if (data.status === 'success') {
        setResultado({ 
          tipo: data.access, 
          mensaje: data.message, 
          nombre: data.affiliateName 
        });
      } else {
        setResultado({ tipo: 'ERROR', mensaje: data.message });
      }

      fetchHistorial();
      setDocumento("");

      setTimeout(() => {
        setResultado(null);
        inputRef.current?.focus();
      }, 4000);

    } catch (error) {
      console.error("Error validando acceso:", error);
      setResultado({ tipo: 'ERROR', mensaje: "Error de conexión con el servidor" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      
      {/* CABECERA */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-3">
          <QrCode className="text-emerald-600" size={36} />
          CONTROL DE ACCESOS
        </h2>
        <p className="text-slate-500 font-medium">Escanea el documento o digita el número para validar la entrada.</p>
      </div>

      {/* ÁREA DE VALIDACIÓN (RECEPCIÓN) */}
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl">
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
          <div className="relative group">
            <input 
              ref={inputRef}
              type="text"
              placeholder="Número de Documento..."
              className="w-full p-6 text-center text-3xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 transition-all text-slate-900 tracking-widest uppercase"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || !documento}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95 tracking-widest flex items-center justify-center gap-3 uppercase"
          >
            {loading ? <Loader2 className="animate-spin" size={28} /> : <Search size={28} />}
            Validar Acceso
          </button>
        </form>

        {/* ALERTA DE RESULTADO */}
        {resultado && (
          <div className={`mt-8 p-6 rounded-2xl text-center border-2 animate-in fade-in zoom-in duration-300 ${
            resultado.tipo === 'ALLOWED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
            'bg-red-50 border-red-200 text-red-700'
          }`}>
            {resultado.tipo === 'ALLOWED' ? (
              <CheckCircle size={60} className="mx-auto mb-3 text-emerald-500" />
            ) : (
              <XCircle size={60} className="mx-auto mb-3 text-red-500" />
            )}
            
            {resultado.nombre && <h3 className="text-2xl font-black uppercase mb-1">{resultado.nombre}</h3>}
            <p className="text-lg font-bold tracking-widest">{resultado.mensaje}</p>
          </div>
        )}
      </div>

      {/* HISTORIAL RECIENTE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Clock className="text-emerald-500" size={20} />
             <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Accesos de Hoy</h3>
           </div>
           
           <button 
             onClick={() => setIsHistorialOpen(true)}
             className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 bg-slate-200 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
           >
             <History size={16} /> Ver Todo
           </button>
        </div>
        
        <div className="divide-y divide-slate-100">
          {historial.length === 0 ? (
            <p className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No hay registros hoy</p>
          ) : (
            historial.map((acceso) => (
              <div key={acceso.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-black text-slate-800 truncate">{acceso.affiliate?.fullName || 'Desconocido'}</p>
                  <p className="text-xs font-bold text-slate-500 font-mono mt-0.5">{acceso.affiliate?.documentNumber}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(acceso.accessTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    acceso.status === 'ALLOWED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {acceso.status === 'ALLOWED' ? 'Permitido' : 'Denegado'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Drawer del Historial Completo */}
      <HistorialAccesosDrawer 
        isOpen={isHistorialOpen} 
        onClose={() => setIsHistorialOpen(false)} 
      />

    </div>
  );
}
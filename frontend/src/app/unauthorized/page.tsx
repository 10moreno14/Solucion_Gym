import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 max-w-md text-center">
        <div className="bg-red-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="text-red-600" size={48} />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
          ACCESO DENEGADO
        </h1>
        <p className="text-slate-500 font-medium mb-8">
          Tu cuenta no tiene los permisos necesarios para acceder a esta sección del sistema.
        </p>

        <Link 
          href="/"
          className="flex items-center justify-center gap-2 bg-slate-900 text-white w-full py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <ArrowLeft size={20} /> Volver al Inicio
        </Link>
      </div>
      
      <p className="mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
        Solución Gym • Seguridad Biométrica Activa
      </p>
    </div>
  );

  
}

"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // 👈 Importamos la librería Excel
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Power, 
  Server,
  Activity,
  Search,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

type Gym = {
  id: string;
  nombre: string;
  plan: string;
  isActive: boolean;
  modulos: {
    dashboard: boolean;
    planes: boolean;
    afiliados: boolean;
    accesos: boolean;
    caja: boolean;
  };
};

export default function SuperAdminPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [cargando, setCargando] = useState(true);

  // 🌟 NUEVOS ESTADOS PARA BÚSQUEDA Y PAGINACIÓN
  const [busqueda, setBusqueda] = useState("");
  const [limite, setLimite] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);

  // 1. CARGAR DATOS
  useEffect(() => {
    const cargarGyms = async () => {
      try {
        const respuesta = await fetch(`https://solucion-gym-api.lemonsea-b914d72f.eastus2.azurecontainerapps.io/admin/gyms`);
        const datos = await respuesta.json();
        if (Array.isArray(datos)) setGyms(datos);
      } catch (error) {
        console.error("Error al cargar gimnasios:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarGyms();
  }, []);

  // Resetear a la página 1 si el usuario busca algo o cambia el límite
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, limite]);

  // 2. ACTUALIZAR MÓDULO
  const toggleModulo = async (gymId: string, modulo: keyof Gym["modulos"]) => {
    const gymActual = gyms.find((g) => g.id === gymId);
    if (!gymActual) return;
    const nuevoEstado = !gymActual.modulos[modulo];

    setGyms((prev) => prev.map((gym) => gym.id === gymId ? { ...gym, modulos: { ...gym.modulos, [modulo]: nuevoEstado } } : gym));

    try {
      const respuesta = await fetch(`https://solucion-gym-api.lemonsea-b914d72f.eastus2.azurecontainerapps.io/admin/gyms/${gymId}/modules`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulo, activo: nuevoEstado }),
      });
      if (!respuesta.ok) throw new Error("Error al guardar");
    } catch (error) {
      setGyms((prev) => prev.map((gym) => gym.id === gymId ? { ...gym, modulos: { ...gym.modulos, [modulo]: !nuevoEstado } } : gym));
    }
  };

  // 3. KILL SWITCH (ESTADO)
  const toggleGymStatus = async (gymId: string, currentStatus: boolean) => {
    if (currentStatus && !window.confirm("¿Estás seguro de suspender este gimnasio?")) return;
    const nuevoEstado = !currentStatus;

    setGyms((prev) => prev.map((gym) => gym.id === gymId ? { ...gym, isActive: nuevoEstado } : gym));

    try {
      const respuesta = await fetch(`https://solucion-gym-api.lemonsea-b914d72f.eastus2.azurecontainerapps.io/admin/gyms/${gymId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nuevoEstado }),
      });
      if (!respuesta.ok) throw new Error("Error de estado");
    } catch (error) {
      setGyms((prev) => prev.map((gym) => gym.id === gymId ? { ...gym, isActive: currentStatus } : gym));
      alert("Error de comunicación.");
    }
  };

  // 🌟 4. FUNCIÓN PARA EXPORTAR A EXCEL (.XLSX)
  const exportarExcel = () => {
    // Formateamos los datos para que sean legibles en Excel
    const datosFormateados = gimnasiosFiltrados.map((gym) => ({
      "ID Cliente": gym.id,
      "Nombre del Gimnasio": gym.nombre,
      "Plan Actual": gym.plan,
      "Estado": gym.isActive ? "Activo" : "Suspendido",
      "Módulo: Dashboard": gym.modulos.dashboard ? "Sí" : "No",
      "Módulo: Planes": gym.modulos.planes ? "Sí" : "No",
      "Módulo: Afiliados": gym.modulos.afiliados ? "Sí" : "No",
      "Módulo: Accesos": gym.modulos.accesos ? "Sí" : "No",
      "Módulo: Caja": gym.modulos.caja ? "Sí" : "No",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosFormateados);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Gimnasios");
    
    // Genera el archivo y fuerza la descarga
    XLSX.writeFile(libro, `Reporte_Gimnasios_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 🌟 5. LÓGICA DE FILTRADO Y PAGINACIÓN
  const gimnasiosFiltrados = gyms.filter(gym => 
    gym.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    gym.id.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(gimnasiosFiltrados.length / limite);
  const gimnasiosPaginados = gimnasiosFiltrados.slice(
    (paginaActual - 1) * limite, 
    paginaActual * limite
  );

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-emerald-500">
        <Activity className="animate-pulse mb-4" size={48} />
        <p className="font-bold tracking-widest uppercase text-sm">Cargando servidores...</p>
      </div>
    );
  }

  const activos = gyms.filter(g => g.isActive).length;
  const suspendidos = gyms.filter(g => !g.isActive).length;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* ENCABEZADO Y TARJETAS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900/50 p-6 md:p-8 rounded-3xl border border-slate-800/60 shadow-xl backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="text-emerald-500" size={32} />
              <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 tracking-tight">
                Super Admin
              </h1>
            </div>
            <p className="text-slate-400 font-medium">Gestión de Licencias y Control de Acceso</p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="bg-slate-950/50 px-5 py-3 rounded-2xl border border-emerald-500/20 flex items-center gap-4 flex-1 md:flex-none">
              <Server className="text-emerald-500" size={20} />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Activos</p>
                <p className="text-xl font-black text-emerald-400">{activos}</p>
              </div>
            </div>
            <div className="bg-slate-950/50 px-5 py-3 rounded-2xl border border-rose-500/20 flex items-center gap-4 flex-1 md:flex-none">
              <Power className="text-rose-500" size={20} />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Suspendidos</p>
                <p className="text-xl font-black text-rose-400">{suspendidos}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 BARRA DE HERRAMIENTAS (Buscador, Límite, Exportar) */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
          
          {/* Buscador */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o ID..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Límite por página */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Mostrar:</span>
              <select 
                value={limite}
                onChange={(e) => setLimite(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={1000}>Todos</option>
              </select>
            </div>

            {/* Botón Excel */}
            <button 
              onClick={exportarExcel}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
            >
              <Download size={16} />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800/60 text-slate-400 text-[11px] uppercase tracking-widest">
                  <th className="p-5 font-bold">Cliente / Gimnasio</th>
                  <th className="p-5 font-bold text-center border-l border-slate-800/30">Estado</th>
                  <th className="p-5 font-bold text-center border-l border-slate-800/30">Dashboard</th>
                  <th className="p-5 font-bold text-center">Planes</th>
                  <th className="p-5 font-bold text-center">Afiliados</th>
                  <th className="p-5 font-bold text-center">Accesos</th>
                  <th className="p-5 font-bold text-center">Caja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {gimnasiosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4 text-slate-500">
                        <Search size={24} />
                      </div>
                      <p className="text-slate-400 font-medium">No se encontraron resultados.</p>
                    </td>
                  </tr>
                ) : (
                  gimnasiosPaginados.map((gym) => (
                    <tr 
                      key={gym.id} 
                      className={`transition-all duration-200 hover:bg-slate-800/30 ${!gym.isActive ? 'opacity-60 bg-rose-950/10' : ''}`}
                    >
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${gym.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div>
                            <div className="font-bold text-slate-200 text-base">{gym.nombre}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                {gym.plan}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                                {gym.id.split('_')[1] || gym.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-5 text-center border-l border-slate-800/30">
                        <button
                          onClick={() => toggleGymStatus(gym.id, gym.isActive)}
                          className={`flex items-center justify-center w-full gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            gym.isActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                          }`}
                        >
                          {gym.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {gym.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                        </button>
                      </td>
                      
                      <td className="p-5 text-center border-l border-slate-800/30">
                        <ToggleSwitch activo={gym.modulos.dashboard} onChange={() => toggleModulo(gym.id, "dashboard")} disabled={!gym.isActive} />
                      </td>
                      <td className="p-5 text-center">
                        <ToggleSwitch activo={gym.modulos.planes} onChange={() => toggleModulo(gym.id, "planes")} disabled={!gym.isActive} />
                      </td>
                      <td className="p-5 text-center">
                        <ToggleSwitch activo={gym.modulos.afiliados} onChange={() => toggleModulo(gym.id, "afiliados")} disabled={!gym.isActive} />
                      </td>
                      <td className="p-5 text-center">
                        <ToggleSwitch activo={gym.modulos.accesos} onChange={() => toggleModulo(gym.id, "accesos")} disabled={!gym.isActive} />
                      </td>
                      <td className="p-5 text-center">
                        <ToggleSwitch activo={gym.modulos.caja} onChange={() => toggleModulo(gym.id, "caja")} disabled={!gym.isActive} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* 🌟 CONTROLES DE PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="bg-slate-900 border-t border-slate-800/60 p-4 flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">
                Mostrando {gimnasiosPaginados.length} de {gimnasiosFiltrados.length} resultados
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-4 font-bold text-slate-300">
                  {paginaActual} / {totalPaginas}
                </span>
                <button 
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// COMPONENTE INTERRUPTOR
function ToggleSwitch({ activo, onChange, disabled }: { activo: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
      } ${
        activo ? "bg-emerald-500" : "bg-slate-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
          activo ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
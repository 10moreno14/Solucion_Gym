"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Plus, FileText, Trash2, Download, Calendar, 
  MapPin, Wrench, Pencil, Search, X, Filter, 
  Loader2 // ✅ Importación agregada
} from "lucide-react";
import ReporteDrawer from "@/components/ReporteDrawer";
import { pdf } from '@react-pdf/renderer';
import ReportePDF from "@/components/ReportePDF";

export default function MantenimientoPage() {
  const { isLoaded, userId, getToken } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reporteParaEditar, setReporteParaEditar] = useState<any | null>(null);

  // --- ESTADOS DE FILTROS ---
  const [filtroCliente, setFiltroCliente] = useState<{id: string, name: string} | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // 📥 CARGAR REPORTES (Con soporte para filtros)
  const fetchReportes = async () => {
    if (!isLoaded || !userId) return;
    setLoading(true);
    try {
        const token = await getToken();
        let url = `http://localhost:3000/get-reports?clerkId=${userId}`;
        
        if (filtroCliente) url += `&clientId=${filtroCliente.id}`;
        if (fechaInicio) url += `&start=${fechaInicio}`;
        if (fechaFin) url += `&end=${fechaFin}`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store"
        });
        const data = await res.json();
        if (Array.isArray(data)) setReportes(data);
    } catch (error) {
        console.error("Error al obtener reportes:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportes();
  }, [isLoaded, userId, filtroCliente, fechaInicio, fechaFin]);

  // Buscar clientes para el filtro
  const buscarClientesFiltro = async (texto: string) => {
    setBusquedaCliente(texto);
    if (texto.length < 2) { setSugerencias([]); return; }
    try {
        const token = await getToken();
        const res = await fetch(`http://localhost:3000/search-clients?q=${texto}`, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        const data = await res.json();
        setSugerencias(data);
    } catch (e) {
        console.error("Error buscando clientes:", e);
    }
  };

  const limpiarFiltros = () => {
    setFiltroCliente(null);
    setBusquedaCliente("");
    setFechaInicio("");
    setFechaFin("");
  };

  // --- HANDLERS ---

  const handleCreate = () => {
    setReporteParaEditar(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (reporte: any) => {
    setReporteParaEditar(reporte);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("¿Estás seguro de eliminar este reporte?")) return;
    setReportes(prev => prev.filter(r => r.id !== id));
    try {
        await fetch('http://localhost:3000/delete-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
    } catch (error) { 
        alert("Error al eliminar"); 
    }
  };

  const handleDownload = async (reporte: any) => {
    const datosPDF = {
        clienteNombre: reporte.client?.name || "Cliente Desconocido",
        direccion: reporte.client?.address || "N/A",
        telefono: reporte.client?.phone || "N/A",
        nit: reporte.client?.nit || "N/A",
        marca: reporte.machine?.brand || "",
        modelo: reporte.machine?.model || reporte.machine?.name || "Equipo General",
        serial: reporte.machine?.serial || "",
        tecnicoNombre: reporte.technicianName,
        tecnicoCc: reporte.technicianCc || "",
        observaciones: reporte.observations || reporte.observaciones || "",
        fotosAntes: reporte.photosBefore || [], 
        fotosDespues: reporte.photosAfter || [],
        fecha: new Date(reporte.date).toLocaleDateString()
    };

    try {
        const blob = await pdf(<ReportePDF data={datosPDF} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte-${reporte.reportNumber}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error generando PDF:", error);
        alert("Error al generar el PDF.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">Historial de Reportes</h2>
           <p className="text-gray-500 mt-1">Gestiona y filtra tus intervenciones técnicas</p>
        </div>
        <button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2">
          <Plus size={20} /> Nuevo Reporte
        </button>
      </div>

      {/* 🔍 BARRA DE FILTROS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4 text-gray-700 font-bold text-sm uppercase tracking-wider">
            <Filter size={16} /> Filtrar historial
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* Filtro Cliente */}
          <div className="relative md:col-span-2">
            <label className="block text-xs font-bold text-gray-400 mb-1 tracking-tight">NOMBRE DEL CLIENTE / GIMNASIO</label>
            <div className="relative">
                <input 
                    type="text" 
                    value={busquedaCliente}
                    onChange={(e) => buscarClientesFiltro(e.target.value)}
                    placeholder="Escribe para buscar..."
                    className="w-full p-2.5 pl-10 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                {filtroCliente && (
                    <button onClick={() => { setFiltroCliente(null); setBusquedaCliente(""); }} className="absolute right-3 top-2.5 text-red-500 hover:bg-red-50 rounded-full p-0.5">
                        <X size={16} />
                    </button>
                )}
            </div>
            {sugerencias.length > 0 && (
                <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-40 overflow-auto">
                    {sugerencias.map(cli => (
                        <li key={cli.id} onClick={() => { setFiltroCliente(cli); setBusquedaCliente(cli.name); setSugerencias([]); }} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 text-sm font-medium text-gray-700 transition-colors">
                            {cli.name}
                        </li>
                    ))}
                </ul>
            )}
          </div>

          {/* Filtro Fecha Inicio */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 tracking-tight">DESDE (FECHA)</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Filtro Fecha Fin */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 tracking-tight">HASTA (FECHA)</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

        </div>
        
        {(filtroCliente || fechaInicio || fechaFin) && (
            <button onClick={limpiarFiltros} className="mt-4 text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors uppercase">
                <Trash2 size={12} /> Limpiar filtros aplicados
            </button>
        )}
      </div>

      {/* LISTA DE REPORTES */}
      {loading ? (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-blue-500" size={40} />
              Cargando historial...
          </div>
      ) : reportes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-20 text-center">
              <FileText className="mx-auto text-gray-300 mb-4" size={50} />
              <h3 className="text-lg font-bold text-gray-800">No se encontraron reportes</h3>
              <p className="text-gray-500 text-sm">Prueba ajustando los filtros de búsqueda.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportes.map((repo) => (
                  <ReporteCard 
                    key={repo.id} 
                    repo={repo} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete} 
                    onDownload={handleDownload} 
                  />
              ))}
          </div>
      )}

      <ReporteDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        reporteEditar={reporteParaEditar} 
      />
    </div>
  );
}

function ReporteCard({ repo, onEdit, onDelete, onDownload }: any) {
    const clientName = repo.client?.name || "Cliente Eliminado";
    const machineName = repo.machine?.name || "Equipo Eliminado";
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-800 truncate max-w-[180px]" title={clientName}>{clientName}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar size={12} />
                        <span>{new Date(repo.date).toLocaleDateString()}</span>
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">#{repo.reportNumber}</span>
                    </div>
                </div>
                <button onClick={() => onEdit(repo)} className="text-gray-400 hover:text-blue-500 transition-colors p-1" title="Editar">
                    <Pencil size={18} />
                </button>
            </div>
            <div className="p-5 space-y-3">
                <div className="flex items-start gap-3">
                    <Wrench size={16} className="text-gray-400 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Equipo</p>
                        <p className="text-sm text-gray-800 font-medium">{machineName}</p>
                    </div>
                </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
                <button onClick={() => onDelete(repo.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                    <Trash2 size={18} />
                </button>
                <button onClick={() => onDownload(repo)} className="flex items-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    <Download size={16} /> PDF
                </button>
            </div>
        </div>
    );
}
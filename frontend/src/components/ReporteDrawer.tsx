"use client";
import { useState, useEffect, useRef } from "react";
import { X, Save, Camera, User, Wrench, Search, Loader2, UserCog, ClipboardList, Plus, Trash2 } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs"; 
import { pdf } from '@react-pdf/renderer'; 
import ReportePDF from './ReportePDF'; 

interface ReporteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reporteEditar?: any;
}

export default function ReporteDrawer({ isOpen, onClose, reporteEditar }: ReporteDrawerProps) {
  const { getToken } = useAuth();
  const { user } = useUser(); 
  
  const fileInputRefAntes = useRef<HTMLInputElement>(null);
  const fileInputRefDespues = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    id: "",
    clienteId: "",
    clienteNombre: "",
    direccion: "",
    telefono: "",
    nit: "",
    equipoId: "",
    marca: "",
    serial: "",
    modelo: "",
    ubicacion: "",
    tipo: "PREVENTIVO",
    tecnicoNombre: "", 
    tecnicoCc: "",
    actividades: [] as string[],
    observaciones: "",
    fotosAntes: [] as string[],   
    fotosDespues: [] as string[]  
  });

  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [sugerenciasClientes, setSugerenciasClientes] = useState<any[]>([]);
  const [listaMaquinas, setListaMaquinas] = useState<any[]>([]); // Inicializado como array
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [statusText, setStatusText] = useState("Guardar");

  useEffect(() => {
    if (!isOpen) return;

    if (reporteEditar) {
      // 🛡️ CAMBIO 1: Carga segura en edición
      fetch(`http://localhost:3000/get-machines?clientId=${reporteEditar.clientId}`)
          .then(res => res.json())
          .then(maquinas => {
            setListaMaquinas(Array.isArray(maquinas) ? maquinas : []);
          })
          .catch(() => setListaMaquinas([]));

      setFormData({
          id: reporteEditar.id,
          clienteId: reporteEditar.clientId,
          clienteNombre: reporteEditar.client?.name || "",
          direccion: reporteEditar.client?.address || "",
          telefono: reporteEditar.client?.phone || "",
          nit: reporteEditar.client?.nit || "",
          equipoId: reporteEditar.machineId,
          marca: reporteEditar.machine?.brand || "",
          serial: reporteEditar.machine?.serial || "",
          modelo: reporteEditar.machine?.model || "",
          ubicacion: reporteEditar.machine?.location || "",
          tipo: reporteEditar.type || "PREVENTIVO",
          tecnicoNombre: reporteEditar.technicianName || "",
          tecnicoCc: reporteEditar.technicianCc || "",
          actividades: reporteEditar.activities || [],
          observaciones: reporteEditar.observations || reporteEditar.observaciones || "",
          fotosAntes: reporteEditar.photosBefore || [],
          fotosDespues: reporteEditar.photosAfter || []
      });
      setBusquedaCliente(reporteEditar.client?.name || "");

    } else {
      setFormData({
          id: "", clienteId: "", clienteNombre: "", direccion: "", telefono: "", nit: "",
          equipoId: "", marca: "", serial: "", modelo: "", ubicacion: "",
          tipo: "PREVENTIVO", tecnicoNombre: user?.fullName || "", 
          tecnicoCc: "", actividades: [], observaciones: "", fotosAntes: [], fotosDespues: []
      });
      setBusquedaCliente("");
      setListaMaquinas([]);
    }
  }, [isOpen, reporteEditar?.id, user?.fullName]); 

  if (!isOpen) return null;

  const buscarClientes = async (texto: string) => {
    setBusquedaCliente(texto);
    if (texto.length < 2) { setSugerenciasClientes([]); return; }
    setLoadingClientes(true);
    try {
        const token = await getToken();
        const res = await fetch(`http://localhost:3000/search-clients?q=${texto}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setSugerenciasClientes(Array.isArray(data) ? data : []);
    } catch (error) { setSugerenciasClientes([]); } finally { setLoadingClientes(false); }
  };

  const seleccionarCliente = async (cliente: any) => {
    setFormData(prev => ({
        ...prev,
        clienteId: cliente.id || "",
        clienteNombre: cliente.name || "",
        direccion: cliente.address || "",
        telefono: cliente.phone || "",
        nit: cliente.nit || ""
    }));
    setBusquedaCliente(cliente.name);
    setSugerenciasClientes([]); 
    try {
      const res = await fetch(`http://localhost:3000/get-machines?clientId=${cliente.id}`);
      const maquinas = await res.json();
      
      // 🛡️ CAMBIO 2: Validar que sea un Array para que no se pierdan los datos
      if (Array.isArray(maquinas)) {
        setListaMaquinas(maquinas);
      } else {
        setListaMaquinas([]);
      }
    } catch (error) { 
      setListaMaquinas([]);
    }
  };

  const seleccionarMaquina = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const maquina = listaMaquinas.find(m => m.id === e.target.value);
    if(maquina) {
        setFormData(prev => ({
            ...prev, 
            equipoId: maquina.id, 
            marca: maquina.brand || "", 
            serial: maquina.serial || "",
            modelo: maquina.model || "",
            ubicacion: maquina.location || ""
        }));
    }
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'antes' | 'despues') => {
    const file = e.target.files?.[0];
    if (file) {
      const newUrl = URL.createObjectURL(file);
      if (tipo === 'antes') setFormData(prev => ({ ...prev, fotosAntes: [...prev.fotosAntes, newUrl] }));
      else setFormData(prev => ({ ...prev, fotosDespues: [...prev.fotosDespues, newUrl] }));
      e.target.value = "";
    }
  };

  const removePhoto = (index: number, tipo: 'antes' | 'despues') => {
    if (tipo === 'antes') {
      const newPhotos = [...formData.fotosAntes];
      newPhotos.splice(index, 1);
      setFormData(prev => ({ ...prev, fotosAntes: newPhotos }));
    } else {
      const newPhotos = [...formData.fotosDespues];
      newPhotos.splice(index, 1);
      setFormData(prev => ({ ...prev, fotosDespues: newPhotos }));
    }
  };

  const procesarFotos = async (fotos: string[]) => {
    const fotosViejas = fotos.filter(f => !f.startsWith('blob:')); 
    const fotosNuevas = fotos.filter(f => f.startsWith('blob:'));  
    if (fotosNuevas.length === 0) return fotosViejas;
    const formDataUpload = new FormData();
    for (const url of fotosNuevas) {
      const blob = await fetch(url).then(r => r.blob());
      formDataUpload.append('files', blob, 'foto.jpg');
    }
    const res = await fetch('http://localhost:3000/upload', { method: 'POST', body: formDataUpload });
    const urlsNuevas = await res.json();
    return [...fotosViejas, ...urlsNuevas];
  };

  const handleGuardarTodo = async () => {
    if (!formData.clienteId || !formData.equipoId) {
      alert("⚠️ Selecciona Cliente y Equipo."); return;
    }
    setGenerandoPDF(true);
    try {
      const token = await getToken();
      setStatusText("Procesando fotos...");
      const urlsAntesPerm = await procesarFotos(formData.fotosAntes);
      const urlsDespuesPerm = await procesarFotos(formData.fotosDespues);
      const payloadDB = {
          id: formData.id,
          clerkId: user?.id,
          clientId: formData.clienteId,
          equipoId: formData.equipoId,
          tipo: formData.tipo,
          tecnicoNombre: formData.tecnicoNombre,
          tecnicoCc: formData.tecnicoCc,
          actividades: formData.actividades,
          observaciones: formData.observaciones,
          fotosAntes: urlsAntesPerm,
          fotosDespues: urlsDespuesPerm
      };
      const endpoint = reporteEditar ? 'update-report' : 'save-report';
      const resDB = await fetch(`http://localhost:3000/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payloadDB)
      });
      const dataDB = await resDB.json();
      if (dataDB.status === 'error') throw new Error(dataDB.message);
      
      window.location.reload(); 
      onClose();
    } catch (error) {
      alert("Hubo un error al guardar.");
    } finally {
      setGenerandoPDF(false);
      setStatusText("Guardar y Descargar PDF");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full flex animate-slide-in">
        <div className="h-full w-full bg-white shadow-2xl overflow-y-auto flex flex-col">
          
          <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shadow-md sticky top-0 z-20">
            <div>
              <h2 className="text-lg font-bold">{reporteEditar ? "Editar Reporte" : "Nuevo Reporte Técnico"}</h2>
              <p className="text-xs text-slate-400">Diligencia la información del mantenimiento</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors"><X size={24} /></button>
          </div>

          <form className="flex-1 p-8 space-y-8" onSubmit={(e) => e.preventDefault()}>
            
            {/* 1. SECCIÓN CLIENTE (Tus celdas originales) */}
            <div className="space-y-4 relative">
              <h3 className="text-sm font-bold text-blue-600 uppercase flex items-center gap-2 border-b pb-2">
                <User size={18} /> 1. Información del Cliente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2 relative">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Buscar Cliente</label>
                  <div className="relative">
                    <input 
                        type="text" 
                        value={busquedaCliente}
                        onChange={(e) => buscarClientes(e.target.value)}
                        placeholder="Escribe el nombre del gimnasio..." 
                        className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  </div>

                  {sugerenciasClientes.length > 0 && (
                    <ul className="absolute z-30 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-auto">
                        {sugerenciasClientes.map((cli) => (
                            <li key={cli.id} onClick={() => seleccionarCliente(cli)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 font-bold">
                                {cli.name} <span className="text-xs font-normal block text-gray-500">NIT: {cli.nit}</span>
                            </li>
                        ))}
                    </ul>
                  )}
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dirección</label>
                    <input type="text" value={formData.direccion || ""} readOnly className="w-full p-2 bg-gray-50 border rounded-lg text-gray-600 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teléfono</label>
                    <input type="text" value={formData.telefono || ""} readOnly className="w-full p-2 bg-gray-50 border rounded-lg text-gray-600 text-sm" />
                </div>
              </div>
            </div>

            {/* 2. SECCIÓN EQUIPO (Donde estaba el error técnico) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase flex items-center gap-2 border-b pb-2">
                <Wrench size={18} /> 2. Información del Equipo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Seleccionar Equipo</label>
                  <select 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    onChange={seleccionarMaquina}
                    value={formData.equipoId}
                  >
                    <option value="">-- Seleccione --</option>
                    {/* 🛡️ CAMBIO 3: Usamos ?.map para seguridad */}
                    {listaMaquinas?.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name} {m.model ? `- ${m.model}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Marca</label>
                    <input type="text" value={formData.marca || ""} readOnly className="w-full p-2 bg-gray-50 border rounded-lg text-gray-600 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Serial</label>
                    <input type="text" value={formData.serial || ""} readOnly className="w-full p-2 bg-gray-50 border rounded-lg text-gray-600 text-sm" />
                </div>
              </div>
            </div>

            {/* 3. SECCIÓN TÉCNICO */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase flex items-center gap-2 border-b pb-2">
                <UserCog size={18} /> 3. Información del Técnico
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Nombre Técnico</label>
                    <input type="text" value={formData.tecnicoNombre} onChange={(e) => setFormData({...formData, tecnicoNombre: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">C.C. / ID</label>
                    <input type="text" value={formData.tecnicoCc} onChange={(e) => setFormData({...formData, tecnicoCc: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* 4. SECCIÓN EVIDENCIAS */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-blue-600 uppercase flex items-center gap-2 border-b pb-2">
                <Camera size={18} /> 4. Evidencias Fotográficas
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">FOTOS ANTES</label>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRefAntes} onChange={(e) => handleAddPhoto(e, 'antes')} />
                    <button type="button" onClick={() => fileInputRefAntes.current?.click()} className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 flex flex-col items-center justify-center"><Plus className="text-gray-400 mb-1" /><span className="text-[10px] text-gray-500 uppercase">Agregar</span></button>
                    {formData.fotosAntes.map((foto, idx) => (
                        <div key={idx} className="flex-shrink-0 w-24 h-24 relative group rounded-xl overflow-hidden border border-gray-200">
                            <img src={foto} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removePhoto(idx, 'antes')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
              </div>
              
              {/* Fotos Después igual... */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">FOTOS DESPUÉS</label>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRefDespues} onChange={(e) => handleAddPhoto(e, 'despues')} />
                    <button type="button" onClick={() => fileInputRefDespues.current?.click()} className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 flex flex-col items-center justify-center"><Plus className="text-gray-400 mb-1" /><span className="text-[10px] text-gray-500 uppercase">Agregar</span></button>
                    {formData.fotosDespues.map((foto, idx) => (
                        <div key={idx} className="flex-shrink-0 w-24 h-24 relative group rounded-xl overflow-hidden border border-gray-200">
                            <img src={foto} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removePhoto(idx, 'despues')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
              </div>
            </div>

            {/* 5. SECCIÓN OBSERVACIONES */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase flex items-center gap-2 border-b pb-2">
                <ClipboardList size={18} /> 5. Observaciones Finales
              </h3>
              <textarea rows={4} value={formData.observaciones} onChange={(e) => setFormData({...formData, observaciones: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"></textarea>
            </div>
          </form>

          {/* FOOTER */}
          <div className="p-6 bg-gray-50 border-t flex justify-end gap-3 sticky bottom-0 z-20">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-700 font-semibold hover:bg-gray-200 rounded-lg transition-colors text-sm">Cancelar</button>
            <button type="button" onClick={handleGuardarTodo} disabled={generandoPDF} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 text-sm disabled:bg-blue-400 min-w-[200px] justify-center">
              {generandoPDF ? <><Loader2 className="animate-spin" size={18} /> {statusText}</> : <><Save size={18} /> {statusText}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
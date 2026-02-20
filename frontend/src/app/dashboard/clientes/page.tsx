"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Phone, 
  MapPin, 
  Loader2, 
  Hash, 
  Building2 
} from "lucide-react";
import ClienteDrawer from "@/components/ClienteDrawer";

// Definimos la interfaz para evitar errores de tipo 'never'
interface Cliente {
  id: string;
  name: string;
  nit: string;
  address: string;
  phone: string;
  email: string;
}

export default function ClientesPage() {
  const { getToken, userId } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  // Estados para controlar el Drawer (Panel lateral)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<Cliente | null>(null);

  // Función para obtener la lista de clientes desde el backend
  const fetchClientes = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:3000/get-clients?clerkId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    } finally {
      setCargando(false);
    }
  };

  // Función para eliminar un cliente
  const eliminarCliente = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.")) return;
    
    try {
      const token = await getToken();
      const res = await fetch("http://localhost:3000/delete-client", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ id }),
      });

      const result = await res.json();
      if (result.status === 'success') {
        fetchClientes(); // Recargamos la lista
      } else {
        alert(result.message || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error eliminando cliente:", error);
    }
  };

  // Cargar clientes al montar el componente
  useEffect(() => { 
    if (userId) fetchClientes(); 
  }, [userId]);

  // Filtrado en tiempo real por nombre o NIT
  const clientesFiltrados = clientes.filter(c => 
    c.name.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.nit && c.nit.includes(busqueda))
  );

  return (
    <div className="space-y-6 pb-10">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            CLIENTES
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Administra la base de datos de gimnasios y contactos.
          </p>
        </div>
        <button 
          onClick={() => { setClienteAEditar(null); setIsDrawerOpen(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="relative group">
        <Search className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input 
          type="text"
          placeholder="Buscar por nombre o NIT..."
          className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-base transition-all"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {cargando ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="font-medium">Cargando base de datos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.map((cliente) => (
            <div 
              key={cliente.id} 
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                  <Building2 size={24} />
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => { setClienteAEditar(cliente); setIsDrawerOpen(true); }}
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Editar cliente"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => eliminarCliente(cliente.id)}
                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Eliminar cliente"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-800 leading-tight truncate">
                  {cliente.name}
                </h3>
                <div className="flex items-center gap-1.5 text-blue-600">
                   <Hash size={12} className="mt-0.5" />
                   <span className="text-[11px] font-black uppercase tracking-widest">
                     NIT: {cliente.nit || "SIN REGISTRO"}
                   </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3 mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg truncate">
                  <Phone size={16} className="text-slate-400" /> 
                  <span className="font-semibold">{cliente.phone || "---"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <MapPin size={16} className="text-slate-400 shrink-0" /> 
                  <span className="font-medium truncate">{cliente.address || "Sin dirección física"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ESTADO VACÍO */}
      {!cargando && clientesFiltrados.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-inner">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Users size={32} />
          </div>
          <p className="text-slate-500 font-bold">No se encontraron clientes.</p>
          <p className="text-slate-400 text-sm">Prueba con otro nombre o crea un cliente nuevo.</p>
        </div>
      )}

      {/* COMPONENTE DRAWER (Panel lateral para Crear/Editar) */}
      <ClienteDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={fetchClientes}
        clienteEditar={clienteAEditar}
      />
    </div>
  );
}
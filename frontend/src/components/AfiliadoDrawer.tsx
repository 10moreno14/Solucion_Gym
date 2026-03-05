"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Save, Loader2, User, FileText, Hash, Phone, Camera } from "lucide-react"; 
import { API_URL } from "@/config";

interface Afiliado {
  id?: string;
  fullName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  status: string;
  photoUrl?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  afiliadoEditar: Afiliado | null;
}

const emptyForm: Afiliado = {
  fullName: "",
  documentType: "CC",
  documentNumber: "",
  phone: "",
  status: "ACTIVE",
  photoUrl: "", 
};

export default function AfiliadoDrawer({ isOpen, onClose, onSuccess, afiliadoEditar }: Props) {
  // 🌟 CAMBIO CLAVE: Extraemos orgId y definimos el tenantId
  const { getToken, userId, orgId } = useAuth();
  const tenantId = orgId || userId;

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); 
  const [formData, setFormData] = useState<Afiliado>(emptyForm);

  useEffect(() => {
    if (afiliadoEditar) {
      setFormData({
        id: afiliadoEditar.id,
        fullName: afiliadoEditar.fullName,
        documentType: afiliadoEditar.documentType || "CC",
        documentNumber: afiliadoEditar.documentNumber || "",
        phone: afiliadoEditar.phone || "",
        status: afiliadoEditar.status || "ACTIVE",
        photoUrl: afiliadoEditar.photoUrl || "", 
      });
    } else {
      setFormData(emptyForm);
    }
  }, [afiliadoEditar, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append("files", file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formDataUpload,
      });
      
      const urls = await res.json();
      
      if (urls && urls.length > 0) {
        setFormData(prev => ({ ...prev, photoUrl: urls[0] }));
      }
    } catch (error) {
      console.error("Error al subir imagen:", error);
      alert("No se pudo subir la foto.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/save-affiliate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // 🌟 Usamos el tenantId (Empresa) en lugar del userId (Personal)
        body: JSON.stringify({ ...formData, clerkId: tenantId }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose} />}

      <aside className={`
        fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}>
        <div className="h-full flex flex-col">
          
          <div className="p-6 border-b flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                {afiliadoEditar ? "EDITAR AFILIADO" : "NUEVO AFILIADO"}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                Información Personal
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-800">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 📸 SUBIR FOTO */}
            <div className="flex flex-col items-center justify-center gap-4 mb-4">
              <div className="relative w-28 h-28 rounded-[2rem] border-4 border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center overflow-hidden">
                {formData.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-slate-300" />
                )}
                
                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="animate-spin text-emerald-600" size={32} />
                  </div>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="photo-upload" 
                  className={`cursor-pointer px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 ${
                    formData.photoUrl ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  <Camera size={16} /> {formData.photoUrl ? 'Cambiar Foto' : 'Agregar Foto'}
                </label>
                <input 
                  id="photo-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                  disabled={uploadingImage} 
                />
              </div>
            </div>

            {/* Nombre Completo */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Nombre Completo</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black" 
                  placeholder="Ej: Juan Pérez"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Tipo de Documento */}
              <div className="col-span-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Tipo</label>
                <div className="relative mt-1">
                  <FileText className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <select
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black appearance-none bg-white"
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PAS">PAS</option>
                    <option value="TI">TI</option>
                  </select>
                </div>
              </div>

              {/* Número de Documento */}
              <div className="col-span-2">
                <label className="text-xs font-black text-slate-800 uppercase tracking-widest">No. Documento</label>
                <div className="relative mt-1">
                  <Hash className="absolute left-3 top-3.5 text-slate-500" size={18} />
                  <input
                    required
                    type="text"
                    className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black font-mono"
                    placeholder="1234567890"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Celular / WhatsApp</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                  required
                  type="tel"
                  className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-black font-mono"
                  placeholder="300 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

          </form>

          {/* Botones */}
          <div className="p-6 border-t bg-slate-50 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-slate-700 hover:bg-slate-200 rounded-2xl transition-all border border-slate-300">
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading || uploadingImage || !formData.fullName} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95 tracking-widest">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {afiliadoEditar ? "GUARDAR" : "REGISTRAR"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
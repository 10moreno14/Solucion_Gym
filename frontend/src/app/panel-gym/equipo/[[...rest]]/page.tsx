import { OrganizationProfile } from "@clerk/nextjs";

export default function EquipoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Gestión de Equipo 👥
        </h2>
        <p className="text-slate-500 font-medium">
          Administra los miembros de tu gimnasio y sus permisos.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4">
        <OrganizationProfile 
          path="/panel-gym/equipo" 
          routing="path"
          appearance={{
            elements: {
              rootBox: "w-full shadow-none",
              card: "shadow-none border-none w-full",
              navbar: "md:flex", // 👈 Volvemos a mostrar la navegación interna para ver las pestañas
              scrollBox: "rounded-2xl",
              // 🌟 OCULTAR EL BOTÓN DE ABANDONAR
              navbarButton__leaveOrganization: "hidden", 
              organizationProfilePage__leaveOrganization: "hidden",
              // Ocultamos también la sección de "Peligro" si aparece
              dangerSection: "hidden"
            }
          }}
        />
      </div>
    </div>
  );
}
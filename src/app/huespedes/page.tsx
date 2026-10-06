import { Users } from "lucide-react";
import Link from "next/link";

export default function HuespedesPage() {
  return (
    <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between bg-stone-900/60 p-5 rounded-2xl border border-stone-800 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            Base de Huéspedes
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Directorio de pasajeros, historial de estadías y contacto de WhatsApp
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors"
        >
          Volver a Ocupación
        </Link>
      </div>

      <div className="bg-stone-900/80 border border-stone-800 rounded-2xl p-8 text-center text-stone-400">
        <p className="text-sm">
          Módulo de fidelización y base de datos de huéspedes sincronizado con Supabase.
        </p>
      </div>
    </div>
  );
}

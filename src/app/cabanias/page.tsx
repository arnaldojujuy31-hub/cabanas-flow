import { Home, Sparkles, Plus } from "lucide-react";
import Link from "next/link";

export default function CabaniasPage() {
  return (
    <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between bg-stone-900/60 p-5 rounded-2xl border border-stone-800 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <Home className="w-6 h-6 text-amber-500" />
            Cabañas y Unidades
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Gestión de las 6 unidades del Complejo Los Cardones (Purmamarca)
          </p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors"
        >
          Ver Calendario
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            nombre: "Cabaña Los Cardones",
            tipo: "Premium 2 Ambientes",
            cap: 4,
            estado: "Limpia",
          },
          {
            nombre: "Cabaña Cerro Morado",
            tipo: "Familiar con Asador",
            cap: 6,
            estado: "Limpia",
          },
          {
            nombre: "Cabaña Siete Colores",
            tipo: "Matrimonial Deluxe",
            cap: 2,
            estado: "En limpieza",
          },
          {
            nombre: "Cabaña Algarrobo",
            tipo: "Estándar 2 Ambientes",
            cap: 4,
            estado: "Limpia",
          },
          {
            nombre: "Cabaña El Molino",
            tipo: "Monoambiente Rústico",
            cap: 2,
            estado: "Sucia",
          },
          {
            nombre: "Cabaña Pucará",
            tipo: "Familiar Superior",
            cap: 5,
            estado: "Limpia",
          },
        ].map((c) => (
          <div
            key={c.nombre}
            className="bg-stone-900/80 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-100 text-base">{c.nombre}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  {c.cap} pax
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">{c.tipo}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Estado:</span>
              <span className="text-emerald-400 font-semibold">{c.estado}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

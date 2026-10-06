"use client";

import { useState, useEffect } from "react";
import { Home, Sparkles, Plus, Users, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Cabania, COMPLEJO_PILOTO_ID } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

const REAL_CABANIAS_FALLBACK: Cabania[] = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Doble 1",
    tipo: "Doble Matrimonial / Twin",
    capacidad_maxima: 2,
    estado_limpieza: "limpia",
    orden_en_grilla: 1,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Doble 2",
    tipo: "Doble Matrimonial / Twin",
    capacidad_maxima: 2,
    estado_limpieza: "limpia",
    orden_en_grilla: 2,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Cuádruple 3 c/ Terraza",
    tipo: "Cuádruple con Terraza",
    capacidad_maxima: 4,
    estado_limpieza: "limpia",
    orden_en_grilla: 3,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Doble 4 c/ Terraza",
    tipo: "Doble con Terraza",
    capacidad_maxima: 2,
    estado_limpieza: "limpia",
    orden_en_grilla: 4,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000005",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Cuádruple 5",
    tipo: "Cuádruple Familiar",
    capacidad_maxima: 4,
    estado_limpieza: "limpia",
    orden_en_grilla: 5,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000006",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Cuádruple 6",
    tipo: "Cuádruple Familiar",
    capacidad_maxima: 4,
    estado_limpieza: "limpia",
    orden_en_grilla: 6,
    activo: true,
  },
];

export default function CabaniasPage() {
  const [cabanias, setCabanias] = useState<Cabania[]>(REAL_CABANIAS_FALLBACK);
  const [loading, setLoading] = useState(true);

  const fetchCabanias = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("cabanias")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .order("orden_en_grilla", { ascending: true });

      if (data && data.length > 0) {
        setCabanias(data);
      } else {
        setCabanias(REAL_CABANIAS_FALLBACK);
      }
    } catch (err) {
      console.error("Error al cargar cabañas:", err);
      setCabanias(REAL_CABANIAS_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCabanias();
  }, []);

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between bg-stone-900/60 p-5 rounded-2xl border border-stone-800 backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100 flex items-center gap-2">
            <Home className="w-6 h-6 text-amber-500" />
            Cabañas y Unidades
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Gestión de las 6 unidades de Cabañas Purmamarca
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCabanias}
            disabled={loading}
            aria-label="Actualizar"
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors"
          >
            Ver Calendario
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cabanias.map((c) => (
          <div
            key={c.id}
            className="bg-stone-900/80 border border-stone-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-stone-100 text-base">{c.nombre}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {c.capacidad_maxima} pax
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">{c.tipo}</p>
            </div>
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Estado de Limpieza:</span>
              <span className="text-emerald-400 font-semibold capitalize">
                {c.estado_limpieza}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

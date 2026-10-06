"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wrench,
  Brush,
  Home,
  Users,
  LogIn,
  LogOut,
  RefreshCw,
  Plus,
  Check,
  AlertCircle,
  Eye,
  CheckCheck,
} from "lucide-react";
import {
  Cabania,
  EstadoLimpieza,
  Reserva,
  TareaLimpieza,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { NewNovedadModal } from "@/components/NewNovedadModal";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// Mock representativo para las 6 cabañas
const MOCK_CABANIAS: Cabania[] = [
  {
    id: "c0000000-0000-0000-0000-000000000001",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Los Cardones",
    tipo: "Premium 2 Ambientes",
    capacidad_maxima: 4,
    estado_limpieza: "limpia",
    orden_en_grilla: 1,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000002",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Cerro Morado",
    tipo: "Familiar con Asador",
    capacidad_maxima: 6,
    estado_limpieza: "a_limpiar",
    orden_en_grilla: 2,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Siete Colores",
    tipo: "Matrimonial Deluxe",
    capacidad_maxima: 2,
    estado_limpieza: "en_limpieza",
    orden_en_grilla: 3,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000004",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Algarrobo",
    tipo: "Estándar 2 Ambientes",
    capacidad_maxima: 4,
    estado_limpieza: "limpia",
    orden_en_grilla: 4,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000005",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña El Molino",
    tipo: "Monoambiente Rústico",
    capacidad_maxima: 2,
    estado_limpieza: "a_limpiar",
    orden_en_grilla: 5,
    activo: true,
  },
  {
    id: "c0000000-0000-0000-0000-000000000006",
    complejo_id: COMPLEJO_PILOTO_ID,
    nombre: "Cabaña Pucará",
    tipo: "Familiar Superior",
    capacidad_maxima: 5,
    estado_limpieza: "mantenimiento",
    orden_en_grilla: 6,
    activo: true,
  },
];

type FiltroLimpieza = "todas" | "a_limpiar" | "en_limpieza" | "limpias" | "mantenimiento";

export default function LimpiezaPage() {
  const [cabanias, setCabanias] = useState<Cabania[]>(MOCK_CABANIAS);
  const [reservasHoy, setReservasHoy] = useState<Reserva[]>([]);
  const [novedades, setNovedades] = useState<TareaLimpieza[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroLimpieza>("todas");
  const [todayIso, setTodayIso] = useState("2026-10-06");

  // Modal Novedades
  const [isNovedadModalOpen, setIsNovedadModalOpen] = useState(false);
  const [selectedCabaniaId, setSelectedCabaniaId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTodayIso(format(new Date(), "yyyy-MM-dd"));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const todayStr = format(new Date(), "yyyy-MM-dd");

      // 1. Cabañas
      const { data: cabData } = await supabase
        .from("cabanias")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .order("orden_en_grilla", { ascending: true });

      if (cabData && cabData.length > 0) {
        setCabanias(cabData);
      } else {
        setCabanias(MOCK_CABANIAS);
      }

      // 2. Reservas de hoy
      const { data: resData } = await supabase
        .from("reservas")
        .select("*, huesped:huespedes(*)")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .or(`fecha_checkin.eq.${todayStr},fecha_checkout.eq.${todayStr}`);

      if (resData) {
        setReservasHoy(resData as unknown as Reserva[]);
      }

      // 3. Novedades / Tareas de limpieza
      const { data: novData } = await supabase
        .from("tareas_limpieza")
        .select("*, cabania:cabanias(*)")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .order("created_at", { ascending: false })
        .limit(10);

      if (novData) {
        setNovedades(novData);
      }
    } catch (err) {
      console.error("Error al cargar datos de limpieza:", err);
      setCabanias(MOCK_CABANIAS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actualizar estado de limpieza de una cabaña con feedback optimista
  const handleCambiarEstado = async (
    cabaniaId: string,
    nuevoEstado: EstadoLimpieza
  ) => {
    // 1. Optimistic UI update
    setCabanias((prev) =>
      prev.map((c) => (c.id === cabaniaId ? { ...c, estado_limpieza: nuevoEstado } : c))
    );

    try {
      const supabase = createClient();
      await supabase
        .from("cabanias")
        .update({ estado_limpieza: nuevoEstado })
        .eq("id", cabaniaId);
    } catch (err) {
      console.error("Error al actualizar estado de limpieza:", err);
    }
  };

  // Marcar tarea / novedad como resuelta
  const handleToggleNovedadResuelta = async (novedadId: string, actual: boolean) => {
    setNovedades((prev) =>
      prev.map((n) => (n.id === novedadId ? { ...n, resuelto: !actual } : n))
    );

    try {
      const supabase = createClient();
      await supabase
        .from("tareas_limpieza")
        .update({ resuelto: !actual })
        .eq("id", novedadId);
    } catch (err) {
      console.error("Error al resolver novedad:", err);
    }
  };

  // Filtrado de cabañas
  const cabaniasFiltradas = useMemo(() => {
    return cabanias.filter((c) => {
      const estado = c.estado_limpieza;
      if (filtro === "a_limpiar") {
        return estado === "a_limpiar" || estado === "sucia" || estado === "repaso";
      }
      if (filtro === "en_limpieza") {
        return estado === "en_limpieza";
      }
      if (filtro === "limpias") {
        return estado === "limpia";
      }
      if (filtro === "mantenimiento") {
        return estado === "mantenimiento";
      }
      return true;
    });
  }, [cabanias, filtro]);

  // Contadores rápidos para los badges
  const countALimpiar = cabanias.filter(
    (c) => c.estado_limpieza === "a_limpiar" || c.estado_limpieza === "sucia"
  ).length;
  const countEnLimpieza = cabanias.filter(
    (c) => c.estado_limpieza === "en_limpieza"
  ).length;
  const countLimpias = cabanias.filter((c) => c.estado_limpieza === "limpia").length;
  const countMantenimiento = cabanias.filter(
    (c) => c.estado_limpieza === "mantenimiento"
  ).length;

  const getStatusVisuals = (estado: string) => {
    switch (estado) {
      case "limpia":
        return {
          label: "✨ Lista para Huésped",
          bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          cardBorder: "border-emerald-500/30",
          icon: CheckCircle2,
        };
      case "en_limpieza":
        return {
          label: "⏳ En Proceso de Limpieza",
          bg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
          cardBorder: "border-blue-500/30",
          icon: Clock,
        };
      case "mantenimiento":
        return {
          label: "🔧 Fuera de Servicio / Arreglo",
          bg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          cardBorder: "border-rose-500/30",
          icon: Wrench,
        };
      default: // a_limpiar, sucia, repaso
        return {
          label: "🧹 Requiere Limpieza",
          bg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          cardBorder: "border-amber-500/30",
          icon: AlertTriangle,
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* 1. CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 sm:p-5 rounded-2xl border border-stone-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100">
              Control de Limpieza y Cabañas
            </h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Housekeeping y rotación de unidades • Purmamarca (6 Cabañas)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            aria-label="Actualizar estado"
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={() => {
              setSelectedCabaniaId(undefined);
              setIsNovedadModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs shadow-md shadow-rose-950/40 transition-all cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            <span>Reportar Novedad</span>
          </button>
        </div>
      </div>

      {/* 2. FILTROS TIPO PASTILLA PARA CELULAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFiltro("todas")}
          className={cn(
            "py-2 px-3.5 rounded-xl text-xs font-semibold border shrink-0 transition-all cursor-pointer",
            filtro === "todas"
              ? "bg-amber-600 text-white border-amber-500 shadow-sm"
              : "bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200"
          )}
        >
          Todas ({cabanias.length})
        </button>

        <button
          onClick={() => setFiltro("a_limpiar")}
          className={cn(
            "py-2 px-3.5 rounded-xl text-xs font-semibold border shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
            filtro === "a_limpiar"
              ? "bg-amber-600 text-white border-amber-500 shadow-sm"
              : "bg-stone-900 text-amber-400/90 border-stone-800 hover:text-stone-200"
          )}
        >
          <span>🧹 A Limpiar</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px]">
            {countALimpiar}
          </span>
        </button>

        <button
          onClick={() => setFiltro("en_limpieza")}
          className={cn(
            "py-2 px-3.5 rounded-xl text-xs font-semibold border shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
            filtro === "en_limpieza"
              ? "bg-blue-600 text-white border-blue-500 shadow-sm"
              : "bg-stone-900 text-blue-400 border-stone-800 hover:text-stone-200"
          )}
        >
          <span>⏳ En Proceso</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-[10px]">
            {countEnLimpieza}
          </span>
        </button>

        <button
          onClick={() => setFiltro("limpias")}
          className={cn(
            "py-2 px-3.5 rounded-xl text-xs font-semibold border shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
            filtro === "limpias"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
              : "bg-stone-900 text-emerald-400 border-stone-800 hover:text-stone-200"
          )}
        >
          <span>✨ Limpias</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px]">
            {countLimpias}
          </span>
        </button>

        <button
          onClick={() => setFiltro("mantenimiento")}
          className={cn(
            "py-2 px-3.5 rounded-xl text-xs font-semibold border shrink-0 transition-all cursor-pointer flex items-center gap-1.5",
            filtro === "mantenimiento"
              ? "bg-rose-600 text-white border-rose-500 shadow-sm"
              : "bg-stone-900 text-rose-400 border-stone-800 hover:text-stone-200"
          )}
        >
          <span>🔧 Mantenimiento</span>
          <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-[10px]">
            {countMantenimiento}
          </span>
        </button>
      </div>

      {/* 3. LISTADO DE CABAÑAS EN TARJETAS TÁCTILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {cabaniasFiltradas.map((cabania) => {
          const visuals = getStatusVisuals(cabania.estado_limpieza);
          const StatusIcon = visuals.icon;

          // Buscar si tiene checkin o checkout hoy
          const tieneCheckoutHoy = reservasHoy.some(
            (r) => r.cabania_id === cabania.id && r.fecha_checkout === todayIso
          );
          const tieneCheckinHoy = reservasHoy.some(
            (r) => r.cabania_id === cabania.id && r.fecha_checkin === todayIso
          );

          const esALimpiar =
            cabania.estado_limpieza === "a_limpiar" ||
            cabania.estado_limpieza === "sucia" ||
            cabania.estado_limpieza === "repaso";
          const esEnLimpieza = cabania.estado_limpieza === "en_limpieza";
          const esLimpia = cabania.estado_limpieza === "limpia";
          const esMantenimiento = cabania.estado_limpieza === "mantenimiento";

          return (
            <div
              key={cabania.id}
              className={cn(
                "bg-stone-900/90 border rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all",
                visuals.cardBorder
              )}
            >
              {/* Header de la tarjeta */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-amber-500 shrink-0 shadow">
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-stone-100 truncate">
                        {cabania.nombre}
                      </h3>
                      <p className="text-xs text-stone-400 truncate">
                        {cabania.tipo}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-stone-950 text-amber-400 border border-stone-800 shrink-0">
                    <Users className="w-3 h-3" />
                    {cabania.capacidad_maxima} pax
                  </span>
                </div>

                {/* Badge de Estado Prominente */}
                <div className="pt-1">
                  <span
                    className={cn(
                      "w-full py-1.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 shadow-sm",
                      visuals.bg
                    )}
                  >
                    <StatusIcon className="w-4 h-4" />
                    <span>{visuals.label}</span>
                  </span>
                </div>

                {/* AVISOS DE MOVIMIENTO HOY */}
                {(tieneCheckoutHoy || tieneCheckinHoy) && (
                  <div className="pt-1">
                    {tieneCheckoutHoy && tieneCheckinHoy ? (
                      <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Recambio hoy: Salida e Ingreso</span>
                      </div>
                    ) : tieneCheckoutHoy ? (
                      <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5">
                        <LogOut className="w-3.5 h-3.5 text-amber-400" />
                        <span>Salida programada para hoy (Check-out)</span>
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                        <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ingreso esperado hoy (Check-in)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BOTONES DE ACCIÓN RÁPIDA (1 SOLO TOQUE) */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                {/* Botón Principal de Transición de Estado */}
                {esALimpiar && (
                  <button
                    onClick={() => handleCambiarEstado(cabania.id, "en_limpieza")}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 stroke-[2.5]" />
                    <span>Iniciar Limpieza</span>
                  </button>
                )}

                {esEnLimpieza && (
                  <button
                    onClick={() => handleCambiarEstado(cabania.id, "limpia")}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4 stroke-[3]" />
                    <span>Marcar como Limpia y Lista</span>
                  </button>
                )}

                {esLimpia && (
                  <button
                    onClick={() => handleCambiarEstado(cabania.id, "a_limpiar")}
                    className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white font-semibold text-xs border border-stone-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Brush className="w-3.5 h-3.5 text-amber-400" />
                    <span>Marcar para Repaso / Limpieza</span>
                  </button>
                )}

                {esMantenimiento && (
                  <button
                    onClick={() => handleCambiarEstado(cabania.id, "a_limpiar")}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Reparado / Listo para Limpieza</span>
                  </button>
                )}

                {/* Botón Secundario de Reporte */}
                <button
                  onClick={() => {
                    setSelectedCabaniaId(cabania.id);
                    setIsNovedadModalOpen(true);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-stone-950/80 hover:bg-stone-800 text-stone-400 hover:text-rose-400 font-medium text-xs border border-stone-800/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Reportar Rotura / Faltante</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. SECCIÓN DE NOVEDADES RECIENTES DE HOUSEKEEPING */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
          <span className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Novedades e Incidencias Recientes ({novedades.length})
          </span>
          <span className="text-[11px] text-stone-400">
            {novedades.filter((n) => !n.resuelto).length} pendientes
          </span>
        </div>

        {novedades.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-4">
            No hay incidencias ni roturas reportadas. Todo en orden.
          </p>
        ) : (
          <div className="space-y-2">
            {novedades.map((nov) => (
              <div
                key={nov.id}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all",
                  nov.resuelto
                    ? "bg-stone-950/40 border-stone-800/60 opacity-60"
                    : "bg-stone-950/80 border-rose-500/30"
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "p-1.5 rounded-lg shrink-0 mt-0.5",
                      nov.resuelto
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    )}
                  >
                    {nov.resuelto ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-stone-200">
                      {nov.descripcion}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {nov.cabania?.nombre || "Cabaña"} • Reportado por:{" "}
                      {nov.reportado_por} • {nov.fecha}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleToggleNovedadResuelta(nov.id, nov.resuelto)
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border shrink-0 transition-all cursor-pointer",
                    nov.resuelto
                      ? "bg-stone-800 text-stone-400 border-stone-700"
                      : "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                  )}
                >
                  {nov.resuelto ? "Reabrir" : "Resuelto"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL NUEVA NOVEDAD */}
      <NewNovedadModal
        isOpen={isNovedadModalOpen}
        onClose={() => setIsNovedadModalOpen(false)}
        cabanias={cabanias}
        initialCabaniaId={selectedCabaniaId}
        onNovedadSaved={fetchData}
      />
    </div>
  );
}

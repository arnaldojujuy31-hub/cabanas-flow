"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  format,
  addMonths,
  subMonths,
  isToday,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
  isSameDay,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  TrendingUp,
  LogIn,
  LogOut,
  Home,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter,
} from "lucide-react";
import {
  Cabania,
  Reserva,
  EstadoReserva,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { CalendarGantt } from "@/components/CalendarGantt";
import { ReservaDetailModal } from "@/components/ReservaDetailModal";
import { NewReservaModal } from "@/components/NewReservaModal";
import { formatCurrency } from "@/lib/utils";

// 6 Cabañas Reales de Cabañas Purmamarca
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

export default function OcupacionPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(2026, 9, 1));
  const [today, setToday] = useState<Date>(() => new Date(2026, 9, 1));
  const [cabanias, setCabanias] = useState<Cabania[]>(REAL_CABANIAS_FALLBACK);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  // Inicializar fecha real en el cliente
  useEffect(() => {
    const now = new Date();
    setToday(now);
    setCurrentMonth(now);
  }, []);

  // Modals state
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewReservaOpen, setIsNewReservaOpen] = useState(false);
  const [slotPrefill, setSlotPrefill] = useState<{
    cabaniaId?: string;
    fecha?: string;
  }>({});

  // Cargar datos de Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Obtener Cabañas reales del complejo
      const { data: cabaniasData, error: cabaniasError } = await supabase
        .from("cabanias")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .order("orden_en_grilla", { ascending: true });

      if (cabaniasData && cabaniasData.length > 0) {
        setCabanias(cabaniasData);
      } else {
        setCabanias(REAL_CABANIAS_FALLBACK);
      }

      // 2. Rango de fechas para el mes seleccionado
      const startStr = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endStr = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      // 3. Obtener Reservas con Huéspedes y Pagos reales
      let { data: reservasData, error: reservasError } = await supabase
        .from("reservas")
        .select(
          `
          *,
          huesped:huespedes(*),
          cabania:cabanias(*),
          pagos:pagos_reserva(*)
        `
        )
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .or(`fecha_checkin.lte.${endStr},fecha_checkout.gte.${startStr}`);

      if (reservasError && reservasError.code === "42P01") {
        const res2 = await supabase
          .from("reservas")
          .select(
            `
            *,
            huesped:huespedes(*),
            cabania:cabanias(*),
            pagos:pagos_reservas(*)
          `
          )
          .eq("complejo_id", COMPLEJO_PILOTO_ID)
          .or(`fecha_checkin.lte.${endStr},fecha_checkout.gte.${startStr}`);
        reservasData = res2.data;
      }
      setReservas((reservasData as unknown as Reserva[]) || []);
    } catch (err) {
      console.error("Error al cargar datos de ocupación:", err);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Escuchar evento de creación desde Navbar
  useEffect(() => {
    const handleOpenModal = () => {
      setSlotPrefill({});
      setIsNewReservaOpen(true);
    };
    window.addEventListener("open-new-reserva", handleOpenModal);
    return () =>
      window.removeEventListener("open-new-reserva", handleOpenModal);
  }, []);

  // Navegación de mes
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // Manejar selección de celda vacía para crear reserva
  const handleSelectEmptySlot = (cabaniaId: string, fechaStr: string) => {
    setSlotPrefill({ cabaniaId, fecha: fechaStr });
    setIsNewReservaOpen(true);
  };

  // Manejar selección de reserva existente
  const handleSelectReserva = (reserva: Reserva) => {
    setSelectedReserva(reserva);
    setIsDetailOpen(true);
  };

  // Actualizar estado de una reserva
  const handleUpdateEstado = async (
    reservaId: string,
    nuevoEstado: EstadoReserva
  ) => {
    try {
      const supabase = createClient();
      await supabase
        .from("reservas")
        .update({ estado: nuevoEstado })
        .eq("id", reservaId);

      // Actualizar estado local
      setReservas((prev) =>
        prev.map((r) => (r.id === reservaId ? { ...r, estado: nuevoEstado } : r))
      );
      if (selectedReserva && selectedReserva.id === reservaId) {
        setSelectedReserva({ ...selectedReserva, estado: nuevoEstado });
      }
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  };

  // Métricas rápidas del mes
  const todayIso = format(today, "yyyy-MM-dd");

  const checkinsToday = reservas.filter(
    (r) => r.fecha_checkin === todayIso && r.estado !== "cancelada"
  ).length;

  const checkoutsToday = reservas.filter(
    (r) => r.fecha_checkout === todayIso && r.estado !== "cancelada"
  ).length;

  const cabaniasOcupadasHoy = reservas.filter((r) => {
    if (r.estado === "cancelada") return false;
    try {
      return isWithinInterval(today, {
        start: parseISO(r.fecha_checkin),
        end: parseISO(r.fecha_checkout),
      });
    } catch {
      return false;
    }
  }).length;

  const cabaniasLibresHoy = Math.max(0, cabanias.length - cabaniasOcupadasHoy);

  // Ocupación promedio del mes
  const diasMes = endOfMonth(currentMonth).getDate();
  const totalNochesDisponibles = cabanias.length * diasMes;
  const nochesVendidas = reservas
    .filter((r) => r.estado !== "cancelada")
    .reduce((acc, r) => acc + (r.cantidad_noches || 1), 0);
  const porcentajeOcupacion =
    totalNochesDisponibles > 0
      ? Math.min(100, Math.round((nochesVendidas / totalNochesDisponibles) * 100))
      : 0;

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 sm:p-5 rounded-2xl border border-stone-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100">
              Calendario de Ocupación
            </h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Gestión en tiempo real • Purmamarca (6 Cabañas)
          </p>
        </div>

        {/* NAVEGADOR DE MES */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center bg-stone-950 border border-stone-800 rounded-xl p-1 shadow-inner">
            <button
              onClick={handlePrevMonth}
              aria-label="Mes Anterior"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="px-3 text-xs sm:text-sm font-bold text-stone-200 capitalize min-w-[130px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </span>

            <button
              onClick={handleNextMonth}
              aria-label="Mes Siguiente"
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
          >
            Hoy
          </button>

          <button
            onClick={() => {
              setSlotPrefill({});
              setIsNewReservaOpen(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-xs shadow-md shadow-orange-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS / INDICADORES DEL DÍA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Ocupación Mensual */}
        <div className="bg-stone-900/80 border border-stone-800 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-400 truncate">
              Ocupación Mes
            </p>
            <p className="text-base sm:text-lg font-bold text-stone-100">
              {porcentajeOcupacion}%
            </p>
          </div>
        </div>

        {/* Check-ins Hoy */}
        <div className="bg-stone-900/80 border border-stone-800 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-400 truncate">
              Check-ins Hoy
            </p>
            <p className="text-base sm:text-lg font-bold text-emerald-400">
              {checkinsToday}
            </p>
          </div>
        </div>

        {/* Check-outs Hoy */}
        <div className="bg-stone-900/80 border border-stone-800 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-400 truncate">
              Check-outs Hoy
            </p>
            <p className="text-base sm:text-lg font-bold text-blue-400">
              {checkoutsToday}
            </p>
          </div>
        </div>

        {/* Cabañas Libres */}
        <div className="bg-stone-900/80 border border-stone-800 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-stone-400 truncate">
              Cabañas Libres Hoy
            </p>
            <p className="text-base sm:text-lg font-bold text-stone-100">
              {cabaniasLibresHoy}{" "}
              <span className="text-xs text-stone-400 font-normal">
                / {cabanias.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* LEYENDA Y ESTADOS */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] px-1 text-stone-400">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-semibold text-stone-300">Estados:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
            Confirmada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-500" />
            En Estadía
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            Check-out
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-500" />
            Pendiente
          </span>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Actualizar</span>
        </button>
      </div>

      {/* GRILLA TAPE CHART / GANTT */}
      <CalendarGantt
        currentMonth={currentMonth}
        today={today}
        cabanias={cabanias}
        reservas={reservas}
        onSelectReserva={handleSelectReserva}
        onSelectEmptySlot={handleSelectEmptySlot}
      />

      {/* MODAL DETALLE DE RESERVA */}
      <ReservaDetailModal
        reserva={selectedReserva}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReserva(null);
        }}
        onUpdateEstado={handleUpdateEstado}
        onRefresh={async () => {
          await fetchData();
          if (selectedReserva) {
            // Refrescar reserva seleccionada
            const supabase = createClient();
            const { data } = await supabase
              .from("reservas")
              .select("*, huesped:huespedes(*), cabania:cabanias(*), pagos:pagos_reserva(*)")
              .eq("id", selectedReserva.id)
              .single();
            if (data) setSelectedReserva(data as unknown as Reserva);
          }
        }}
      />

      {/* MODAL NUEVA RESERVA */}
      <NewReservaModal
        isOpen={isNewReservaOpen}
        onClose={() => setIsNewReservaOpen(false)}
        cabanias={cabanias}
        initialCabaniaId={slotPrefill.cabaniaId}
        initialFechaCheckin={slotPrefill.fecha}
        onReservaCreated={() => {
          fetchData();
        }}
      />
    </div>
  );
}

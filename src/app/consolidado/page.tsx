"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Percent,
  Receipt,
  Users,
  Building,
  Vault,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  CheckCircle2,
  Calendar,
  CreditCard,
  BedDouble,
  ShieldCheck,
} from "lucide-react";
import {
  Gasto,
  PagoReserva,
  Reserva,
  ArqueoCaja,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { NewArqueoModal } from "@/components/NewArqueoModal";
import { formatCurrency, cn } from "@/lib/utils";

// Mock representativo para consolidado mensual
const MOCK_PAGOS: PagoReserva[] = [
  {
    id: "p-01",
    complejo_id: COMPLEJO_PILOTO_ID,
    reserva_id: "r-01",
    fecha_cobro: "2026-10-02",
    tipo_pago: "seña",
    medio_pago: "transferencia",
    monto: 127500,
    moneda: "ARS",
    recibido_por: "Claudio",
  },
  {
    id: "p-02",
    complejo_id: COMPLEJO_PILOTO_ID,
    reserva_id: "r-02",
    fecha_cobro: "2026-10-05",
    tipo_pago: "total",
    medio_pago: "tarjeta",
    monto: 340000,
    moneda: "ARS",
    recibido_por: "Ale",
  },
  {
    id: "p-03",
    complejo_id: COMPLEJO_PILOTO_ID,
    reserva_id: "r-03",
    fecha_cobro: "2026-10-07",
    tipo_pago: "seña",
    medio_pago: "transferencia",
    monto: 150000,
    moneda: "ARS",
    recibido_por: "Claudio",
  },
  {
    id: "p-04",
    complejo_id: COMPLEJO_PILOTO_ID,
    reserva_id: "r-04",
    fecha_cobro: "2026-10-09",
    tipo_pago: "saldo",
    medio_pago: "efectivo",
    monto: 127500,
    moneda: "ARS",
    recibido_por: "Recepción",
  },
  {
    id: "p-05",
    complejo_id: COMPLEJO_PILOTO_ID,
    reserva_id: "r-05",
    fecha_cobro: "2026-10-12",
    tipo_pago: "total",
    medio_pago: "transferencia",
    monto: 210000,
    moneda: "ARS",
    recibido_por: "Ale",
  },
];

const MOCK_GASTOS: Gasto[] = [
  {
    id: "g-01",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-02",
    categoria: "Servicios",
    detalle: "Pago de luz EJESA Cabañas",
    monto: 48500,
    moneda: "ARS",
    abonado_por: "Claudio",
  },
  {
    id: "g-02",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-04",
    categoria: "Viáticos Purma",
    detalle: "Combustible viaje supervisión",
    monto: 32000,
    moneda: "ARS",
    abonado_por: "Ale",
  },
  {
    id: "g-03",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-05",
    categoria: "Limpieza",
    detalle: "Servicio lavandería sábanas y toallas",
    monto: 26000,
    moneda: "ARS",
    abonado_por: "Caja Central",
  },
  {
    id: "g-04",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-08",
    categoria: "Insumos",
    detalle: "Artículos de desayuno y amenities",
    monto: 38400,
    moneda: "ARS",
    abonado_por: "Claudio",
  },
  {
    id: "g-05",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-10",
    categoria: "Mantenimiento",
    detalle: "Reparación bomba presurizadora",
    monto: 45000,
    moneda: "ARS",
    abonado_por: "Ale",
  },
  {
    id: "g-06",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-12",
    categoria: "Servicios",
    detalle: "Internet Fibra Óptica Purma + Netflix",
    monto: 24000,
    moneda: "ARS",
    abonado_por: "Caja Central",
  },
];

const MOCK_ARQUEO: ArqueoCaja = {
  id: "arq-01",
  complejo_id: COMPLEJO_PILOTO_ID,
  fecha: "2026-10-06",
  monto_ars: 185000,
  monto_usd: 650,
  responsable: "Recepción",
  observaciones: "Caja de cambio operativa y depósito de cobros en efectivo",
};

export default function ConsolidadoPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(2026, 9, 1));
  const [pagos, setPagos] = useState<PagoReserva[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [arqueos, setArqueos] = useState<ArqueoCaja[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Arqueo
  const [isArqueoModalOpen, setIsArqueoModalOpen] = useState(false);

  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const startStr = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endStr = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      // 1. Pagos del mes
      let { data: pagosData, error: pagosErr } = await supabase
        .from("pagos_reserva")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .gte("fecha_cobro", startStr)
        .lte("fecha_cobro", endStr);

      if (pagosErr && pagosErr.code === "42P01") {
        const res2 = await supabase
          .from("pagos_reservas")
          .select("*")
          .eq("complejo_id", COMPLEJO_PILOTO_ID)
          .gte("fecha_cobro", startStr)
          .lte("fecha_cobro", endStr);
        pagosData = res2.data;
      }

      if (pagosData && pagosData.length > 0) {
        setPagos(pagosData);
      } else {
        setPagos(MOCK_PAGOS);
      }

      // 2. Gastos del mes
      const { data: gastosData } = await supabase
        .from("gastos")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .gte("fecha", startStr)
        .lte("fecha", endStr);

      if (gastosData && gastosData.length > 0) {
        setGastos(gastosData);
      } else {
        setGastos(MOCK_GASTOS);
      }

      // 3. Reservas del mes (para cálculo de ocupación)
      const { data: reservasData } = await supabase
        .from("reservas")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .or(`fecha_checkin.lte.${endStr},fecha_checkout.gte.${startStr}`);

      if (reservasData && reservasData.length > 0) {
        setReservas(reservasData);
      } else {
        setReservas([]);
      }

      // 4. Arqueos de caja
      const { data: arqueosData } = await supabase
        .from("arqueos_caja")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .order("fecha", { ascending: false });

      if (arqueosData && arqueosData.length > 0) {
        setArqueos(arqueosData);
      } else {
        setArqueos([MOCK_ARQUEO]);
      }
    } catch (err) {
      console.error("Error al cargar consolidado:", err);
      setPagos(MOCK_PAGOS);
      setGastos(MOCK_GASTOS);
      setArqueos([MOCK_ARQUEO]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navegación de mes
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // CÁLCULOS FINANCIEROS
  const totalIngresos = useMemo(() => {
    return pagos.reduce((acc, p) => acc + Number(p.monto), 0);
  }, [pagos]);

  const totalGastos = useMemo(() => {
    return gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

  const resultadoNeto = totalIngresos - totalGastos;
  const gananciaPorSocio = resultadoNeto / 2;

  // Ocupación
  const diasMes = endOfMonth(currentMonth).getDate();
  const capacidadTotalNoches = 6 * diasMes; // 6 cabañas
  const nochesVendidas = reservas
    .filter((r) => r.estado !== "cancelada")
    .reduce((acc, r) => acc + (r.cantidad_noches || 1), 0);
  const porcentajeOcupacion =
    capacidadTotalNoches > 0
      ? Math.min(
          100,
          Math.round((nochesVendidas / capacidadTotalNoches) * 100)
        )
      : 0;

  // Desglose por Socio / Cuenta
  const cobradoClaudio = useMemo(() => {
    return pagos
      .filter((p) => p.recibido_por === "Claudio")
      .reduce((acc, p) => acc + Number(p.monto), 0);
  }, [pagos]);

  const cobradoAle = useMemo(() => {
    return pagos
      .filter((p) => p.recibido_por === "Ale")
      .reduce((acc, p) => acc + Number(p.monto), 0);
  }, [pagos]);

  const cobradoRecep = useMemo(() => {
    return pagos
      .filter((p) => p.recibido_por === "Recepción" || !p.recibido_por)
      .reduce((acc, p) => acc + Number(p.monto), 0);
  }, [pagos]);

  const gastadoClaudio = useMemo(() => {
    return gastos
      .filter((g) => g.abonado_por === "Claudio")
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

  const gastadoAle = useMemo(() => {
    return gastos
      .filter((g) => g.abonado_por === "Ale")
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

  const gastadoCaja = useMemo(() => {
    return gastos
      .filter((g) => g.abonado_por === "Caja Central" || !g.abonado_por)
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

  // Liquidación Neta por Socio:
  // Lo que le corresponde a Claudio: Ganancia 50% + Gastos que pagó él - Cobros que ya tiene en su poder
  const netoClaudio = gananciaPorSocio + gastadoClaudio - cobradoClaudio;
  const netoAle = gananciaPorSocio + gastadoAle - cobradoAle;

  const ultimoArqueo = arqueos.length > 0 ? arqueos[0] : null;

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* 1. CABECERA Y SELECTOR DE PERÍODO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 sm:p-5 rounded-2xl border border-stone-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100">
              Consolidado y Métricas Financieras
            </h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Resumen contable, distribución 50/50 y arqueo de caja en Purmamarca
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
            onClick={fetchData}
            disabled={loading}
            aria-label="Actualizar datos"
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* 2. KPIS PRINCIPALES DEL MES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Ingresos Cobrados */}
        <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase">
              Ingresos Cobrados
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(totalIngresos)}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {pagos.length} cobros registrados
            </p>
          </div>
        </div>

        {/* Gastos Totales */}
        <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase">
              Gastos Totales
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-black text-stone-100 font-mono">
              {formatCurrency(totalGastos)}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {gastos.length} comprobantes
            </p>
          </div>
        </div>

        {/* Resultado Neto / Ganancia */}
        <div
          className={cn(
            "p-4 rounded-2xl flex flex-col justify-between space-y-2 shadow-lg border",
            resultadoNeto >= 0
              ? "bg-gradient-to-br from-stone-900 to-emerald-950/40 border-emerald-500/40"
              : "bg-gradient-to-br from-stone-900 to-rose-950/40 border-rose-500/40"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Resultado Neto
            </span>
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border",
                resultadoNeto >= 0
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
              )}
            >
              $
            </div>
          </div>
          <div>
            <p
              className={cn(
                "text-lg sm:text-2xl font-black font-mono",
                resultadoNeto >= 0 ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {formatCurrency(resultadoNeto)}
            </p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              {resultadoNeto >= 0 ? "Ganancia Neta del Mes" : "Déficit Operativo"}
            </p>
          </div>
        </div>

        {/* Tasa de Ocupación */}
        <div className="bg-stone-900/90 border border-stone-800 p-4 rounded-2xl flex flex-col justify-between space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-400 uppercase">
              Ocupación
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
              {porcentajeOcupacion}%
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {nochesVendidas} de {capacidadTotalNoches} noches vendidas
            </p>
          </div>
        </div>
      </div>

      {/* 3. REPARTO DE UTILIDADES (50% / 50% SOCIOS) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Distribución de Utilidades y Liquidación
              </h2>
              <p className="text-xs text-stone-400">
                Partición al 50% entre Claudio y Ale con ajuste de cobros y gastos personales
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] text-stone-400 uppercase font-semibold">
              Ganancia 50% por Socio
            </span>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
              {formatCurrency(gananciaPorSocio)}
            </p>
          </div>
        </div>

        {/* Tarjetas Comparativas de los 2 Socios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Claudio */}
          <div className="bg-stone-950/70 border border-blue-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-base">
                  C
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 text-sm">Claudio</h3>
                  <p className="text-[10px] text-stone-400">Socio 50%</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase">
                  Liquidación Neta
                </span>
                <p
                  className={cn(
                    "text-sm sm:text-base font-bold font-mono",
                    netoClaudio >= 0 ? "text-emerald-400" : "text-amber-400"
                  )}
                >
                  {formatCurrency(netoClaudio)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-stone-800">
              <div className="flex justify-between text-stone-400">
                <span>(+) Ganancia Base (50%):</span>
                <span className="text-stone-200 font-mono">
                  {formatCurrency(gananciaPorSocio)}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>(+) Gastos aportados:</span>
                <span className="text-blue-400 font-mono">
                  +{formatCurrency(gastadoClaudio)}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>(-) Cobros recibidos en mano:</span>
                <span className="text-rose-400 font-mono">
                  -{formatCurrency(cobradoClaudio)}
                </span>
              </div>
            </div>
          </div>

          {/* Ale */}
          <div className="bg-stone-950/70 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-base">
                  A
                </div>
                <div>
                  <h3 className="font-bold text-stone-100 text-sm">Ale</h3>
                  <p className="text-[10px] text-stone-400">Socio 50%</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase">
                  Liquidación Neta
                </span>
                <p
                  className={cn(
                    "text-sm sm:text-base font-bold font-mono",
                    netoAle >= 0 ? "text-emerald-400" : "text-amber-400"
                  )}
                >
                  {formatCurrency(netoAle)}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-2 border-t border-stone-800">
              <div className="flex justify-between text-stone-400">
                <span>(+) Ganancia Base (50%):</span>
                <span className="text-stone-200 font-mono">
                  {formatCurrency(gananciaPorSocio)}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>(+) Gastos aportados:</span>
                <span className="text-emerald-400 font-mono">
                  +{formatCurrency(gastadoAle)}
                </span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>(-) Cobros recibidos en mano:</span>
                <span className="text-rose-400 font-mono">
                  -{formatCurrency(cobradoAle)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Caja y Fondos Comunes */}
        <div className="bg-stone-950/40 border border-stone-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-500" />
            <span>
              Fondo en Caja Central: Cobrado{" "}
              <strong className="text-stone-200">
                {formatCurrency(cobradoRecep)}
              </strong>{" "}
              • Gastado{" "}
              <strong className="text-stone-200">
                {formatCurrency(gastadoCaja)}
              </strong>
            </span>
          </div>
          <span className="text-stone-300 font-semibold font-mono">
            Balance Caja Común: {formatCurrency(cobradoRecep - gastadoCaja)}
          </span>
        </div>
      </div>

      {/* 4. ARQUEO DE CAJA FÍSICA (ARS / USD) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Arqueo de Caja Física y Efectivo
              </h2>
              <p className="text-xs text-stone-400">
                Control de billetes y divisas guardadas en el complejo
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsArqueoModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-xs shadow-md shadow-orange-950/40 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Nuevo Arqueo</span>
          </button>
        </div>

        {/* Tarjeta de Arqueo Actual */}
        {ultimoArqueo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Efectivo ARS */}
            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold">
                  Efectivo en Pesos (ARS)
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
                  {formatCurrency(ultimoArqueo.monto_ars, "ARS")}
                </p>
                <p className="text-[10px] text-stone-500 mt-1">
                  Arqueado por:{" "}
                  <span className="text-stone-300 font-semibold">
                    {ultimoArqueo.responsable}
                  </span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg">
                $
              </div>
            </div>

            {/* Efectivo USD */}
            <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold">
                  Efectivo en Dólares (USD)
                </span>
                <p className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">
                  {formatCurrency(ultimoArqueo.monto_usd, "USD")}
                </p>
                {ultimoArqueo.observaciones && (
                  <p className="text-[10px] text-stone-400 mt-1 truncate max-w-[200px]">
                    {ultimoArqueo.observaciones}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
                USD
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-stone-500 bg-stone-950/40 rounded-xl border border-stone-800">
            Aún no se ha registrado ningún arqueo de caja física.
          </div>
        )}
      </div>

      {/* MODAL NUEVO ARQUEO */}
      <NewArqueoModal
        isOpen={isArqueoModalOpen}
        onClose={() => setIsArqueoModalOpen(false)}
        onArqueoSaved={fetchData}
        currentArs={ultimoArqueo?.monto_ars || 0}
        currentUsd={ultimoArqueo?.monto_usd || 0}
      />
    </div>
  );
}

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
  Receipt,
  Plus,
  ArrowRightLeft,
  User,
  Wallet,
  Building,
  Tag,
  Trash2,
  Edit2,
  RefreshCw,
  Filter,
  CheckCircle2,
  TrendingDown,
  CreditCard,
} from "lucide-react";
import {
  Gasto,
  AbonadoPor,
  CategoriaGasto,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { NewGastoModal } from "@/components/NewGastoModal";
import { formatCurrency, cn } from "@/lib/utils";

// Mock representativo inicial para el complejo en Purmamarca
const MOCK_GASTOS: Gasto[] = [
  {
    id: "g-001",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-02",
    categoria: "Servicios",
    detalle: "Pago de luz EJESA (Medidor Cabañas)",
    monto: 48500,
    moneda: "ARS",
    abonado_por: "Claudio",
    medio_pago: "transferencia",
  },
  {
    id: "g-002",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-04",
    categoria: "Viáticos Purma",
    detalle: "Combustible viaje supervisión Jujuy - Purmamarca",
    monto: 32000,
    moneda: "ARS",
    abonado_por: "Ale",
    medio_pago: "tarjeta",
  },
  {
    id: "g-003",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-05",
    categoria: "Limpieza",
    detalle: "Servicio de lavandería de blancos y toallas (Lote 1)",
    monto: 26000,
    moneda: "ARS",
    abonado_por: "Caja Central",
    medio_pago: "efectivo",
  },
  {
    id: "g-004",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-08",
    categoria: "Insumos",
    detalle: "Compra de amenities, café, té y artículos de tocador",
    monto: 38400,
    moneda: "ARS",
    abonado_por: "Claudio",
    medio_pago: "transferencia",
  },
  {
    id: "g-005",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-10",
    categoria: "Mantenimiento",
    detalle: "Reparación bomba de agua y presurizadora Cabaña 2",
    monto: 45000,
    moneda: "ARS",
    abonado_por: "Ale",
    medio_pago: "transferencia",
  },
  {
    id: "g-006",
    complejo_id: COMPLEJO_PILOTO_ID,
    fecha: "2026-10-12",
    categoria: "Servicios",
    detalle: "Internet Fibra Óptica Purmamarca + Netflix cabañas",
    monto: 24000,
    moneda: "ARS",
    abonado_por: "Caja Central",
    medio_pago: "transferencia",
  },
];

export default function GastosPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(2026, 9, 1));
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroPagador, setFiltroPagador] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");

  // Modal Nuevo/Editar Gasto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gastoToEdit, setGastoToEdit] = useState<Gasto | null>(null);

  // Inicializar fecha real en cliente
  useEffect(() => {
    setCurrentMonth(new Date());
  }, []);

  // Cargar gastos desde Supabase
  const fetchGastos = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const startStr = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endStr = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("gastos")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .gte("fecha", startStr)
        .lte("fecha", endStr)
        .order("fecha", { ascending: false });

      if (data && data.length > 0) {
        setGastos(data);
      } else {
        // Si no hay datos en BD aún en el mes actual, mostramos mock inicial
        setGastos(MOCK_GASTOS);
      }
    } catch (err) {
      console.error("Error al cargar gastos:", err);
      setGastos(MOCK_GASTOS);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos]);

  // Navegación de mes
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  // Eliminar gasto
  const handleDeleteGasto = async (gastoId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este gasto?")) return;

    try {
      const supabase = createClient();
      await supabase.from("gastos").delete().eq("id", gastoId);
      setGastos((prev) => prev.filter((g) => g.id !== gastoId));
    } catch (err) {
      console.error("Error al eliminar gasto:", err);
      setGastos((prev) => prev.filter((g) => g.id !== gastoId));
    }
  };

  // CÁLCULOS DE RENDICIÓN Y BALANCE DE SOCIOS
  const totalGastos = useMemo(() => {
    return gastos.reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

  const totalClaudio = useMemo(() => {
    return gastos
      .filter((g) => g.abonado_por === "Claudio")
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

  const totalAle = useMemo(() => {
    return gastos
      .filter((g) => g.abonado_por === "Ale")
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

  const totalCaja = useMemo(() => {
    return gastos
      .filter((g) => g.abonado_por === "Caja Central" || !g.abonado_por)
      .reduce((acc, g) => acc + Number(g.monto), 0);
  }, [gastos]);

  // Balance entre socios (Partición 50/50 de lo abonado de su bolsillo)
  // Quien pagó de más debe recibir la mitad de la diferencia
  const balanceSocios = useMemo(() => {
    const diff = totalClaudio - totalAle;
    const compensacion = Math.abs(diff) / 2;

    if (diff > 0) {
      return {
        deudor: "Ale",
        acreedor: "Claudio",
        monto: compensacion,
        mensaje: `Ale debe compensar a Claudio con ${formatCurrency(compensacion)}`,
        status: "claudio_a_favor",
      };
    } else if (diff < 0) {
      return {
        deudor: "Claudio",
        acreedor: "Ale",
        monto: compensacion,
        mensaje: `Claudio debe compensar a Ale con ${formatCurrency(compensacion)}`,
        status: "ale_a_favor",
      };
    } else {
      return {
        deudor: null,
        acreedor: null,
        monto: 0,
        mensaje: "Cuentas equilibradas entre socios (50% / 50%)",
        status: "equilibrado",
      };
    }
  }, [totalClaudio, totalAle]);

  // Lista filtrada
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const matchPagador =
        filtroPagador === "todos" || g.abonado_por === filtroPagador;
      const matchCategoria =
        filtroCategoria === "todas" || g.categoria === filtroCategoria;
      return matchPagador && matchCategoria;
    });
  }, [gastos, filtroPagador, filtroCategoria]);

  const getBadgeCategoria = (categoria: string) => {
    switch (categoria) {
      case "Servicios":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "Limpieza":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "Viáticos Purma":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      case "Mantenimiento":
        return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "Insumos":
        return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      case "Blancos":
        return "text-teal-400 bg-teal-500/10 border-teal-500/30";
      case "Comisiones Booking":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/30";
      case "Impuestos":
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
      default:
        return "text-stone-400 bg-stone-500/10 border-stone-500/30";
    }
  };

  const getBadgePagador = (abonadoPor: string) => {
    switch (abonadoPor) {
      case "Claudio":
        return "bg-blue-500/20 text-blue-300 border-blue-500/40";
      case "Ale":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* 1. CABECERA Y SELECTOR DE PERÍODO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 sm:p-5 rounded-2xl border border-stone-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100">
              Gastos y Rendición de Socios
            </h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Complejo Purmamarca • Balance Claudio & Ale (50/50)
          </p>
        </div>

        {/* NAVEGADOR DE MES Y BOTÓN REGISTRAR */}
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
              setGastoToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-xs shadow-md shadow-orange-950/40 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETA RESUMEN DE RENDICIÓN DE SOCIOS (FUNCIONALIDAD ESTRELLA) */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                Rendición y Compensación de Socios
              </h2>
              <p className="text-xs text-stone-400">
                Partición equitativa al 50% de desembolsos personales
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-stone-400 uppercase font-semibold">
              Total Gastos del Mes
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-400">
              {formatCurrency(totalGastos)}
            </p>
          </div>
        </div>

        {/* Desglose de Pagadores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Claudio */}
          <div className="bg-stone-950/70 border border-blue-500/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm">
                C
              </div>
              <div>
                <span className="text-xs font-bold text-blue-300">Claudio</span>
                <p className="text-[10px] text-stone-400">Aportó de su bolsillo</p>
              </div>
            </div>
            <p className="text-base font-bold text-stone-100">
              {formatCurrency(totalClaudio)}
            </p>
          </div>

          {/* Ale */}
          <div className="bg-stone-950/70 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm">
                A
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-300">Ale</span>
                <p className="text-[10px] text-stone-400">Aportó de su bolsillo</p>
              </div>
            </div>
            <p className="text-base font-bold text-stone-100">
              {formatCurrency(totalAle)}
            </p>
          </div>

          {/* Caja Central */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 flex items-center justify-center">
                <Building className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-200">
                  Caja Central
                </span>
                <p className="text-[10px] text-stone-400">Fondo del Complejo</p>
              </div>
            </div>
            <p className="text-base font-bold text-stone-100">
              {formatCurrency(totalCaja)}
            </p>
          </div>
        </div>

        {/* RESULTADO DE LA COMPENSACIÓN ENTRE SOCIOS */}
        <div
          className={cn(
            "p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all",
            balanceSocios.status === "equilibrado"
              ? "bg-stone-950/80 border-stone-800 text-stone-300"
              : balanceSocios.status === "claudio_a_favor"
              ? "bg-blue-950/30 border-blue-500/40 text-blue-200"
              : "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold",
                balanceSocios.status === "equilibrado"
                  ? "bg-stone-800 text-stone-300"
                  : balanceSocios.status === "claudio_a_favor"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/50"
                  : "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
              )}
            >
              {balanceSocios.status === "equilibrado" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <ArrowRightLeft className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold opacity-80 block">
                Estado de Compensación (50/50)
              </span>
              <p className="text-sm sm:text-base font-bold text-stone-100 mt-0.5">
                {balanceSocios.mensaje}
              </p>
            </div>
          </div>

          {balanceSocios.monto > 0 && (
            <div className="bg-stone-900/90 border border-stone-800 px-4 py-2 rounded-xl">
              <span className="text-[10px] text-stone-400 block uppercase">
                A transferir
              </span>
              <span className="text-lg font-black text-amber-400">
                {formatCurrency(balanceSocios.monto)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. FILTROS Y CONTROLES */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filtro por Pagador */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-stone-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            Pagado por:
          </span>
          {["todos", "Claudio", "Ale", "Caja Central"].map((pag) => (
            <button
              key={pag}
              onClick={() => setFiltroPagador(pag)}
              className={cn(
                "py-1.5 px-3 rounded-xl text-xs font-medium border shrink-0 transition-all cursor-pointer capitalize",
                filtroPagador === pag
                  ? "bg-amber-600 text-white border-amber-500 shadow-sm font-semibold"
                  : "bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200"
              )}
            >
              {pag}
            </button>
          ))}
        </div>

        {/* Filtro por Categoría */}
        <div className="flex items-center gap-2">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="bg-stone-900 border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
          >
            <option value="todas">Todas las categorías</option>
            <option value="Servicios">Servicios</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Viáticos Purma">Viáticos Purma</option>
            <option value="Mantenimiento">Mantenimiento</option>
            <option value="Insumos">Insumos</option>
            <option value="Blancos">Blancos</option>
            <option value="Comisiones Booking">Comisiones Booking</option>
            <option value="Impuestos">Impuestos</option>
            <option value="Otros">Otros</option>
          </select>

          <button
            onClick={fetchGastos}
            disabled={loading}
            aria-label="Actualizar"
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* 4. LISTADO DE GASTOS (MOBILE-FRIENDLY) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-stone-800 bg-stone-950/60 flex items-center justify-between">
          <span className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-amber-500" />
            Comprobantes y Gastos ({gastosFiltrados.length})
          </span>
          <span className="text-xs font-bold text-amber-400">
            Subtotal:{" "}
            {formatCurrency(
              gastosFiltrados.reduce((acc, g) => acc + Number(g.monto), 0)
            )}
          </span>
        </div>

        {gastosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-xs">
            No se encontraron gastos para los filtros o el mes seleccionado.
          </div>
        ) : (
          <div className="divide-y divide-stone-800/80">
            {gastosFiltrados.map((gasto) => {
              const formattedDate = (() => {
                try {
                  return format(parseISO(gasto.fecha), "dd/MM");
                } catch {
                  return gasto.fecha;
                }
              })();

              return (
                <div
                  key={gasto.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-stone-800/40 transition-colors group"
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Date Badge */}
                    <div className="w-11 h-11 rounded-xl bg-stone-950 border border-stone-800 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-stone-300 font-mono">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-stone-100 truncate">
                        {gasto.detalle}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Categoría Badge */}
                        <span
                          className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-md border",
                            getBadgeCategoria(gasto.categoria)
                          )}
                        >
                          {gasto.categoria}
                        </span>

                        {/* Pagador Badge */}
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                            getBadgePagador(gasto.abonado_por)
                          )}
                        >
                          {gasto.abonado_por}
                        </span>

                        {gasto.medio_pago && (
                          <span className="text-[10px] text-stone-500 capitalize hidden sm:inline">
                            • {gasto.medio_pago}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right actions and amount */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-bold text-stone-100 font-mono">
                        {formatCurrency(gasto.monto, gasto.moneda)}
                      </p>
                      {gasto.moneda === "USD" && (
                        <span className="text-[10px] text-amber-400 font-bold block">
                          USD
                        </span>
                      )}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setGastoToEdit(gasto);
                          setIsModalOpen(true);
                        }}
                        aria-label="Editar Gasto"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteGasto(gasto.id)}
                        aria-label="Eliminar Gasto"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE NUEVO / EDITAR GASTO */}
      <NewGastoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setGastoToEdit(null);
        }}
        onGastoSaved={fetchGastos}
        gastoToEdit={gastoToEdit}
      />
    </div>
  );
}

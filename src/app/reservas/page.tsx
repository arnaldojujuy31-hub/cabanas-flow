"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarCheck,
  Search,
  Plus,
  Filter,
  DollarSign,
  User,
  Home,
  Calendar,
  CreditCard,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
  Users,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  Reserva,
  Cabania,
  EstadoReserva,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { ReservaDetailModal } from "@/components/ReservaDetailModal";
import { NewReservaModal } from "@/components/NewReservaModal";
import { formatCurrency, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Mock representativo para la lista de reservas
const MOCK_RESERVAS: Reserva[] = [
  {
    id: "r-001",
    complejo_id: COMPLEJO_PILOTO_ID,
    cabania_id: "c0000000-0000-0000-0000-000000000001",
    huesped_id: "h-001",
    fecha_checkin: "2026-10-06",
    fecha_checkout: "2026-10-09",
    cantidad_noches: 3,
    cantidad_pasajeros: 4,
    origen_reserva: "whatsapp",
    estado: "checkin",
    monto_total: 255000,
    moneda: "ARS",
    notas_operativas: "Llegó al mediodía. Abonó 50% de seña por transferencia.",
    huesped: {
      id: "h-001",
      complejo_id: COMPLEJO_PILOTO_ID,
      nombre_completo: "Martín González",
      dni_o_pasaporte: "32.456.789",
      telefono_whatsapp: "+54 9 11 4455-6677",
      email: "martin.gonzalez@gmail.com",
      ciudad_origen: "Buenos Aires",
    },
    cabania: {
      id: "c0000000-0000-0000-0000-000000000001",
      complejo_id: COMPLEJO_PILOTO_ID,
      nombre: "Cabaña Los Cardones",
      tipo: "Premium 2 Ambientes",
      capacidad_maxima: 4,
      estado_limpieza: "limpia",
      orden_en_grilla: 1,
      activo: true,
    },
    pagos: [
      {
        id: "p-001",
        complejo_id: COMPLEJO_PILOTO_ID,
        reserva_id: "r-001",
        fecha_cobro: "2026-09-20",
        tipo_pago: "seña",
        medio_pago: "transferencia",
        monto: 127500,
        moneda: "ARS",
        recibido_por: "Claudio",
      },
    ],
  },
  {
    id: "r-002",
    complejo_id: COMPLEJO_PILOTO_ID,
    cabania_id: "c0000000-0000-0000-0000-000000000003",
    huesped_id: "h-002",
    fecha_checkin: "2026-10-08",
    fecha_checkout: "2026-10-12",
    cantidad_noches: 4,
    cantidad_pasajeros: 2,
    origen_reserva: "booking",
    estado: "confirmada",
    monto_total: 340000,
    moneda: "ARS",
    notas_operativas: "Pareja de luna de miel. Requieren late check-out si es posible.",
    huesped: {
      id: "h-002",
      complejo_id: COMPLEJO_PILOTO_ID,
      nombre_completo: "Valeria Rossi & Santiago",
      dni_o_pasaporte: "38.900.112",
      telefono_whatsapp: "+54 9 351 234-5678",
      email: "valeria.rossi@hotmail.com",
      ciudad_origen: "Córdoba Capital",
    },
    cabania: {
      id: "c0000000-0000-0000-0000-000000000003",
      complejo_id: COMPLEJO_PILOTO_ID,
      nombre: "Cabaña Siete Colores",
      tipo: "Matrimonial Deluxe",
      capacidad_maxima: 2,
      estado_limpieza: "en_limpieza",
      orden_en_grilla: 3,
      activo: true,
    },
    pagos: [
      {
        id: "p-002",
        complejo_id: COMPLEJO_PILOTO_ID,
        reserva_id: "r-002",
        fecha_cobro: "2026-09-28",
        tipo_pago: "total",
        medio_pago: "tarjeta",
        monto: 340000,
        moneda: "ARS",
        recibido_por: "Ale",
      },
    ],
  },
  {
    id: "r-003",
    complejo_id: COMPLEJO_PILOTO_ID,
    cabania_id: "c0000000-0000-0000-0000-000000000002",
    huesped_id: "h-003",
    fecha_checkin: "2026-10-14",
    fecha_checkout: "2026-10-18",
    cantidad_noches: 4,
    cantidad_pasajeros: 6,
    origen_reserva: "directo",
    estado: "confirmada",
    monto_total: 420000,
    moneda: "ARS",
    notas_operativas: "Familia con niños. Vienen en 2 vehículos.",
    huesped: {
      id: "h-003",
      complejo_id: COMPLEJO_PILOTO_ID,
      nombre_completo: "Carlos Benítez",
      dni_o_pasaporte: "28.112.445",
      telefono_whatsapp: "+54 9 387 600-9988",
      email: "carlos.benitez@yahoo.com.ar",
      ciudad_origen: "Salta",
    },
    cabania: {
      id: "c0000000-0000-0000-0000-000000000002",
      complejo_id: COMPLEJO_PILOTO_ID,
      nombre: "Cabaña Cerro Morado",
      tipo: "Familiar con Asador",
      capacidad_maxima: 6,
      estado_limpieza: "limpia",
      orden_en_grilla: 2,
      activo: true,
    },
    pagos: [
      {
        id: "p-003",
        complejo_id: COMPLEJO_PILOTO_ID,
        reserva_id: "r-003",
        fecha_cobro: "2026-10-01",
        tipo_pago: "seña",
        medio_pago: "transferencia",
        monto: 150000,
        moneda: "ARS",
        recibido_por: "Claudio",
      },
    ],
  },
];

type TabFiltro = "todas" | "pendientes" | "proximos" | "en_estadia";

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [cabanias, setCabanias] = useState<Cabania[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabFiltro>("todas");
  const [todayDateStr, setTodayDateStr] = useState<string>("2026-10-06");

  // Modales
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewReservaOpen, setIsNewReservaOpen] = useState(false);

  useEffect(() => {
    setTodayDateStr(format(new Date(), "yyyy-MM-dd"));
  }, []);

  // Cargar datos
  const fetchReservas = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Cabañas
      const { data: cabData } = await supabase
        .from("cabanias")
        .select("*")
        .eq("complejo_id", COMPLEJO_PILOTO_ID)
        .order("orden_en_grilla", { ascending: true });

      if (cabData && cabData.length > 0) {
        setCabanias(cabData);
      }

      // Reservas
      let { data: resData, error } = await supabase
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
        .order("fecha_checkin", { ascending: false });

      if (error && error.code === "42P01") {
        // Fallback pagos_reservas
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
          .order("fecha_checkin", { ascending: false });
        resData = res2.data;
      }

      if (resData && resData.length > 0) {
        setReservas(resData as unknown as Reserva[]);
      } else {
        setReservas(MOCK_RESERVAS);
      }
    } catch (err) {
      console.error("Error al cargar reservas:", err);
      setReservas(MOCK_RESERVAS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservas();
  }, [fetchReservas]);

  // Manejar actualización de estado
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

  // Filtrado
  const filteredReservas = useMemo(() => {
    return reservas.filter((res) => {
      // 1. Buscador texto
      const nombre = res.huesped?.nombre_completo?.toLowerCase() || "";
      const cab = res.cabania?.nombre?.toLowerCase() || "";
      const query = searchTerm.toLowerCase();
      const matchSearch = nombre.includes(query) || cab.includes(query);
      if (!matchSearch) return false;

      // 2. Filtro Tabs
      const totalPagado =
        res.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0;
      const saldo = Math.max(0, res.monto_total - totalPagado);

      if (activeTab === "pendientes") {
        return saldo > 0 && res.estado !== "cancelada";
      }
      if (activeTab === "proximos") {
        return res.fecha_checkin >= todayDateStr && res.estado !== "cancelada";
      }
      if (activeTab === "en_estadia") {
        return res.estado === "checkin";
      }

      return true;
    });
  }, [reservas, searchTerm, activeTab, todayDateStr]);

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case "confirmada":
        return {
          label: "Confirmada",
          bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        };
      case "checkin":
        return {
          label: "En Estadía",
          bg: "bg-blue-500/20 text-blue-400 border-blue-500/40",
        };
      case "checkout":
        return {
          label: "Check-Out",
          bg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        };
      case "cancelada":
        return {
          label: "Cancelada",
          bg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
        };
      default:
        return {
          label: "Pendiente",
          bg: "bg-purple-500/20 text-purple-400 border-purple-500/40",
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 sm:p-5 rounded-2xl border border-stone-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-100">
              Gestión General de Reservas
            </h1>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Control de estadías, saldos pendientes y cobranzas en Purmamarca
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReservas}
            disabled={loading}
            aria-label="Actualizar lista"
            className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            onClick={() => setIsNewReservaOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-xs shadow-md shadow-orange-950/40 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* BUSCADOR Y PESTAÑAS DE FILTRO RÁPIDO */}
      <div className="space-y-3">
        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre del huésped o cabaña..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-stone-900 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-stone-100 text-sm placeholder:text-stone-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
          />
        </div>

        {/* Tabs de Filtro */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "todas", label: "Todas" },
            { id: "pendientes", label: "⚠️ Con Saldo Pendiente" },
            { id: "proximos", label: "📅 Próximos Check-ins" },
            { id: "en_estadia", label: "🏨 En Estadía" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabFiltro)}
              className={cn(
                "py-2 px-3.5 rounded-xl text-xs font-semibold border shrink-0 transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-amber-600 text-white border-amber-500 shadow-sm"
                  : "bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE TARJETAS DE RESERVA */}
      <div className="space-y-3">
        {filteredReservas.length === 0 ? (
          <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-12 text-center text-stone-500 text-xs">
            No se encontraron reservas para el criterio seleccionado.
          </div>
        ) : (
          filteredReservas.map((res) => {
            const totalPagado =
              res.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0;
            const saldoPendiente = Math.max(0, res.monto_total - totalPagado);
            const estaPagadoCompleto =
              saldoPendiente === 0 && res.monto_total > 0;
            const badge = getBadgeEstado(res.estado);

            const formatFechaCorta = (fechaStr: string) => {
              try {
                return format(parseISO(fechaStr), "d MMM", { locale: es });
              } catch {
                return fechaStr;
              }
            };

            const rawPhone =
              res.huesped?.telefono_whatsapp?.replace(/\D/g, "") || "";
            const whatsappUrl = rawPhone
              ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(
                  `¡Hola ${res.huesped?.nombre_completo || ""}! Te contactamos por tu reserva en ${res.cabania?.nombre || "Cabañas Purmamarca"}. Saldo pendiente: ${formatCurrency(saldoPendiente, res.moneda)}.`
                )}`
              : null;

            return (
              <div
                key={res.id}
                onClick={() => {
                  setSelectedReserva(res);
                  setIsDetailOpen(true);
                }}
                className="bg-stone-900/90 border border-stone-800/90 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg transition-all cursor-pointer group active:scale-[0.99] space-y-3"
              >
                {/* Top Row: Huésped & Estado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                      {res.huesped?.nombre_completo?.charAt(0) || "H"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-stone-100 truncate group-hover:text-amber-400 transition-colors">
                        {res.huesped?.nombre_completo || "Sin nombre"}
                      </h3>
                      <p className="text-xs text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <Home className="w-3.5 h-3.5 text-amber-500" />
                        <span className="truncate">
                          {res.cabania?.nombre || "Cabaña"}
                        </span>
                        <span className="text-[10px] text-stone-500 uppercase font-semibold">
                          • {res.origen_reserva}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Estado Badge */}
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0",
                      badge.bg
                    )}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Middle Row: Fechas & Pasajeros */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-300">
                    <LogIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>In: {formatFechaCorta(res.fecha_checkin)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-300">
                    <LogOut className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Out: {formatFechaCorta(res.fecha_checkout)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-stone-400 col-span-2 sm:col-span-1">
                    <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      {res.cantidad_noches}n • {res.cantidad_pasajeros} pax
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Financiero & Saldo Pendiente */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-800/60">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-semibold block">
                      Total / Cobrado
                    </span>
                    <p className="text-xs font-semibold text-stone-300 font-mono">
                      {formatCurrency(res.monto_total, res.moneda)} /{" "}
                      <span className="text-emerald-400">
                        {formatCurrency(totalPagado, res.moneda)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge Saldo */}
                    {estaPagadoCompleto ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Pagado
                      </span>
                    ) : (
                      <div className="text-right">
                        <span className="text-[10px] text-rose-400 font-semibold block">
                          Saldo Pendiente
                        </span>
                        <span className="text-xs font-black text-rose-400 font-mono">
                          {formatCurrency(saldoPendiente, res.moneda)}
                        </span>
                      </div>
                    )}

                    {/* WhatsApp Quick Icon */}
                    {whatsappUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(whatsappUrl, "_blank");
                        }}
                        aria-label="Contactar por WhatsApp"
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DETALLE DE RESERVA CON HISTORIAL DE COBROS */}
      <ReservaDetailModal
        reserva={selectedReserva}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedReserva(null);
        }}
        onUpdateEstado={handleUpdateEstado}
        onRefresh={async () => {
          await fetchReservas();
          if (selectedReserva) {
            const supabase = createClient();
            const { data } = await supabase
              .from("reservas")
              .select(
                "*, huesped:huespedes(*), cabania:cabanias(*), pagos:pagos_reserva(*)"
              )
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
        onReservaCreated={fetchReservas}
      />
    </div>
  );
}

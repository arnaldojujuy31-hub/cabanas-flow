"use client";

import { useState } from "react";
import {
  X,
  Calendar,
  User,
  Phone,
  MessageCircle,
  CreditCard,
  CheckCircle2,
  Clock,
  LogOut,
  LogIn,
  AlertCircle,
  FileText,
  MapPin,
  Home,
  Users,
  Plus,
  Trash2,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { Reserva, EstadoReserva, PagoReserva } from "@/types/database";
import { formatCurrency, cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { NewPagoModal } from "@/components/NewPagoModal";
import { createClient } from "@/lib/supabase/client";

interface ReservaDetailModalProps {
  reserva: Reserva | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateEstado?: (reservaId: string, nuevoEstado: EstadoReserva) => Promise<void>;
  onRefresh?: () => void;
}

export function ReservaDetailModal({
  reserva,
  isOpen,
  onClose,
  onUpdateEstado,
  onRefresh,
}: ReservaDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [deletingPagoId, setDeletingPagoId] = useState<string | null>(null);

  if (!isOpen || !reserva) return null;

  const huesped = reserva.huesped;
  const cabania = reserva.cabania;

  // Formato fechas
  const formatFecha = (fechaStr: string) => {
    try {
      return format(parseISO(fechaStr), "EEEE d 'de' MMMM, yyyy", {
        locale: es,
      });
    } catch {
      return fechaStr;
    }
  };

  // Cálculos de pago
  const totalPagado =
    reserva.pagos?.reduce((acc, p) => acc + Number(p.monto), 0) ?? 0;
  const saldoPendiente = Math.max(0, reserva.monto_total - totalPagado);
  const estaPagadoCompleto = saldoPendiente === 0 && reserva.monto_total > 0;

  // Teléfono para WhatsApp
  const rawPhone = huesped?.telefono_whatsapp?.replace(/\D/g, "") || "";
  const whatsappUrl = rawPhone
    ? `https://wa.me/${rawPhone}?text=${encodeURIComponent(
        `¡Hola ${huesped?.nombre_completo || ""}! Te contactamos desde Cabañas en Purmamarca por tu estadía en ${cabania?.nombre || "la cabaña"} (In: ${reserva.fecha_checkin} - Out: ${reserva.fecha_checkout}). Saldo pendiente: ${formatCurrency(saldoPendiente, reserva.moneda)}. ¿Cómo podemos ayudarte?`
      )}`
    : null;

  const handleEstadoChange = async (nuevoEstado: EstadoReserva) => {
    if (!onUpdateEstado) return;
    setIsUpdating(true);
    try {
      await onUpdateEstado(reserva.id, nuevoEstado);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePago = async (pagoId: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro de pago?")) return;

    setDeletingPagoId(pagoId);
    try {
      const supabase = createClient();
      let { error } = await supabase.from("pagos_reserva").delete().eq("id", pagoId);
      if (error && error.code === "42P01") {
        await supabase.from("pagos_reservas").delete().eq("id", pagoId);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Error al eliminar pago:", err);
    } finally {
      setDeletingPagoId(null);
    }
  };

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case "confirmada":
        return {
          label: "Confirmada",
          bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          icon: CheckCircle2,
        };
      case "checkin":
        return {
          label: "En Estadía (Check-In)",
          bg: "bg-blue-500/20 text-blue-400 border-blue-500/40",
          icon: LogIn,
        };
      case "checkout":
        return {
          label: "Check-Out / Saliente",
          bg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
          icon: LogOut,
        };
      case "cancelada":
        return {
          label: "Cancelada",
          bg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
          icon: AlertCircle,
        };
      default:
        return {
          label: "Pendiente",
          bg: "bg-purple-500/20 text-purple-400 border-purple-500/40",
          icon: Clock,
        };
    }
  };

  const badge = getBadgeEstado(reserva.estado);
  const BadgeIcon = badge.icon;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl md:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/70 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-100">
                  {cabania?.nombre || "Detalle de Reserva"}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                      badge.bg
                    )}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                  <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold">
                    • {reserva.origen_reserva}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
            {/* Tarjeta Huésped & WhatsApp */}
            <div className="bg-stone-950/70 border border-stone-800/90 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white font-bold text-base shadow-md">
                    {huesped?.nombre_completo?.charAt(0) || "H"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-100 text-base">
                      {huesped?.nombre_completo || "Sin nombre registrado"}
                    </h4>
                    {huesped?.ciudad_origen && (
                      <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        {huesped.ciudad_origen}
                      </p>
                    )}
                    {huesped?.dni_o_pasaporte && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        DNI / Pasaporte:{" "}
                        <span className="text-stone-300 font-mono">
                          {huesped.dni_o_pasaporte}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Contact Bar */}
              {huesped?.telefono_whatsapp && (
                <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center gap-2">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                      <span>WhatsApp ({huesped.telefono_whatsapp})</span>
                    </a>
                  )}
                  <a
                    href={`tel:${huesped.telefono_whatsapp}`}
                    className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
                    title="Llamar por teléfono"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Estadía: Fechas y Pasajeros */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-stone-950/50 border border-stone-800/80 rounded-xl p-3">
                <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1.5 mb-1">
                  <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                  Check-in
                </span>
                <p className="text-xs sm:text-sm font-bold text-stone-200">
                  {formatFecha(reserva.fecha_checkin)}
                </p>
              </div>

              <div className="bg-stone-950/50 border border-stone-800/80 rounded-xl p-3">
                <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1.5 mb-1">
                  <LogOut className="w-3.5 h-3.5 text-amber-400" />
                  Check-out
                </span>
                <p className="text-xs sm:text-sm font-bold text-stone-200">
                  {formatFecha(reserva.fecha_checkout)}
                </p>
              </div>

              <div className="bg-stone-950/50 border border-stone-800/80 rounded-xl p-3">
                <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  Duración
                </span>
                <p className="text-sm font-bold text-stone-200">
                  {reserva.cantidad_noches}{" "}
                  {reserva.cantidad_noches === 1 ? "noche" : "noches"}
                </p>
              </div>

              <div className="bg-stone-950/50 border border-stone-800/80 rounded-xl p-3">
                <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Pasajeros
                </span>
                <p className="text-sm font-bold text-stone-200">
                  {reserva.cantidad_pasajeros} pax
                </p>
              </div>
            </div>

            {/* SECCIÓN FINANCIERA & BALANCE */}
            <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  Resumen de Pagos y Señas
                </span>

                {estaPagadoCompleto ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% Pagado
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    Saldo Pendiente
                  </span>
                )}
              </div>

              {/* 3 Bloques de Monto */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-2.5">
                  <p className="text-[10px] text-stone-400 uppercase font-semibold">
                    Monto Total
                  </p>
                  <p className="text-sm sm:text-base font-bold text-stone-100 font-mono mt-0.5">
                    {formatCurrency(reserva.monto_total, reserva.moneda)}
                  </p>
                </div>

                <div className="bg-stone-900/90 border border-emerald-500/30 rounded-xl p-2.5">
                  <p className="text-[10px] text-emerald-400 uppercase font-semibold">
                    Cobrado
                  </p>
                  <p className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {formatCurrency(totalPagado, reserva.moneda)}
                  </p>
                </div>

                <div
                  className={cn(
                    "rounded-xl p-2.5 border",
                    saldoPendiente > 0
                      ? "bg-rose-950/30 border-rose-500/40 text-rose-300"
                      : "bg-stone-900/90 border-stone-800 text-stone-400"
                  )}
                >
                  <p className="text-[10px] uppercase font-semibold">
                    Saldo Restante
                  </p>
                  <p
                    className={cn(
                      "text-sm sm:text-base font-bold font-mono mt-0.5",
                      saldoPendiente > 0 ? "text-rose-400" : "text-emerald-400"
                    )}
                  >
                    {formatCurrency(saldoPendiente, reserva.moneda)}
                  </p>
                </div>
              </div>

              {/* HISTORIAL DE PAGOS */}
              <div className="pt-2 border-t border-stone-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-300">
                    Historial de Cobros ({reserva.pagos?.length || 0})
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsPagoModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Registrar Cobro</span>
                  </button>
                </div>

                {(!reserva.pagos || reserva.pagos.length === 0) ? (
                  <p className="text-xs text-stone-500 py-3 text-center bg-stone-950/40 rounded-xl border border-stone-800/60">
                    Aún no hay cobros ni señas registradas para esta estadía.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {reserva.pagos.map((pago) => {
                      const formattedDate = (() => {
                        try {
                          return format(parseISO(pago.fecha_cobro), "dd/MM/yy");
                        } catch {
                          return pago.fecha_cobro;
                        }
                      })();

                      return (
                        <div
                          key={pago.id}
                          className="flex items-center justify-between p-2.5 bg-stone-950/70 border border-stone-800 rounded-xl text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[11px] font-mono text-stone-400">
                              {formattedDate}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {pago.tipo_pago}
                            </span>
                            <span className="text-stone-300 truncate font-medium">
                              {pago.medio_pago}
                            </span>
                            {pago.recibido_por && (
                              <span className="text-[10px] text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded">
                                {pago.recibido_por}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-400 font-mono">
                              +{formatCurrency(pago.monto, pago.moneda)}
                            </span>

                            <button
                              disabled={deletingPagoId === pago.id}
                              onClick={() => handleDeletePago(pago.id)}
                              aria-label="Eliminar pago"
                              className="p-1 text-stone-500 hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Notas Operativas */}
            {reserva.notas_operativas && (
              <div className="bg-stone-950/40 border border-stone-800/80 rounded-xl p-3.5">
                <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  Notas operativas
                </span>
                <p className="text-xs text-stone-300 whitespace-pre-line">
                  {reserva.notas_operativas}
                </p>
              </div>
            )}

            {/* Acciones Rápidas de Cambio de Estado */}
            <div className="space-y-2 pt-2 border-t border-stone-800">
              <span className="text-xs font-semibold text-stone-400 block mb-2">
                Cambiar Estado Operativo
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={isUpdating || reserva.estado === "confirmada"}
                  onClick={() => handleEstadoChange("confirmada")}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                    reserva.estado === "confirmada"
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-700"
                  )}
                >
                  Confirmada
                </button>

                <button
                  disabled={isUpdating || reserva.estado === "checkin"}
                  onClick={() => handleEstadoChange("checkin")}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                    reserva.estado === "checkin"
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-700"
                  )}
                >
                  Ingreso (Check-in)
                </button>

                <button
                  disabled={isUpdating || reserva.estado === "checkout"}
                  onClick={() => handleEstadoChange("checkout")}
                  className={cn(
                    "py-2 px-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer",
                    reserva.estado === "checkout"
                      ? "bg-amber-600 text-white border-amber-500"
                      : "bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-700"
                  )}
                >
                  Salida (Check-out)
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-stone-800 bg-stone-950/70 flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-sm transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Registrar Cobro / Seña */}
      <NewPagoModal
        isOpen={isPagoModalOpen}
        onClose={() => setIsPagoModalOpen(false)}
        reserva={reserva}
        saldoPendiente={saldoPendiente}
        onPagoSaved={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
}

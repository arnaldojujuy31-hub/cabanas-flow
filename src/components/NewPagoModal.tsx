"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Check,
  Zap,
  FileText,
} from "lucide-react";
import {
  Reserva,
  TipoPago,
  MedioPago,
  CobradoPor,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { formatCurrency, cn } from "@/lib/utils";

interface NewPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  reserva: Reserva | null;
  saldoPendiente: number;
  onPagoSaved: () => void;
}

const TIPOS_PAGO: { id: TipoPago; label: string; desc: string }[] = [
  { id: "seña", label: "Seña", desc: "Reserva inicial" },
  { id: "saldo", label: "Saldo", desc: "Pago restante" },
  { id: "total", label: "Total", desc: "Pago 100%" },
  { id: "adicional", label: "Adicional", desc: "Consumos / Late checkout" },
];

const MEDIOS_PAGO: { id: MedioPago; label: string }[] = [
  { id: "transferencia", label: "Transferencia" },
  { id: "efectivo", label: "Efectivo" },
  { id: "tarjeta", label: "Tarjeta / Débito" },
  { id: "mercadopago", label: "Mercado Pago" },
];

const COBRADORES: { id: CobradoPor; label: string }[] = [
  { id: "Claudio", label: "Claudio" },
  { id: "Ale", label: "Ale" },
  { id: "Recepción", label: "Recepción" },
];

export function NewPagoModal({
  isOpen,
  onClose,
  reserva,
  saldoPendiente,
  onPagoSaved,
}: NewPagoModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [monto, setMonto] = useState("");
  const [tipoPago, setTipoPago] = useState<TipoPago>("seña");
  const [medioPago, setMedioPago] = useState<MedioPago>("transferencia");
  const [cobradoPor, setCobradoPor] = useState<CobradoPor>("Claudio");
  const [fechaCobro, setFechaCobro] = useState("");
  const [cuentaDestino, setCuentaDestino] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (isOpen) {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      setFechaCobro(todayStr);

      // Si hay saldo pendiente sugerimos saldo o total
      if (saldoPendiente > 0) {
        setMonto(saldoPendiente.toString());
        setTipoPago("saldo");
      } else {
        setMonto("");
        setTipoPago("seña");
      }

      setMedioPago("transferencia");
      setCobradoPor("Claudio");
      setCuentaDestino("");
      setNotas("");
      setErrorMsg(null);
    }
  }, [isOpen, saldoPendiente]);

  if (!isOpen || !reserva) return null;

  const handleCompletarSaldo = () => {
    if (saldoPendiente > 0) {
      setMonto(saldoPendiente.toString());
      setTipoPago("saldo");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg("Por favor ingresa un importe de pago válido mayor a 0.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const payload = {
        complejo_id: COMPLEJO_PILOTO_ID,
        reserva_id: reserva.id,
        fecha_cobro: fechaCobro || format(new Date(), "yyyy-MM-dd"),
        tipo_pago: tipoPago,
        medio_pago: medioPago,
        monto: montoNum,
        moneda: reserva.moneda || "ARS",
        recibido_por: cobradoPor,
        cuenta_destino: cuentaDestino.trim() || null,
        notas: notas.trim() || null,
      };

      // Intentar insertar en tabla pagos_reserva o pagos_reservas
      let { error } = await supabase.from("pagos_reserva").insert(payload);

      if (error && error.code === "42P01") {
        // Fallback al nombre alternativo de tabla si existe
        const res2 = await supabase.from("pagos_reservas").insert(payload);
        error = res2.error;
      }

      if (error) {
        console.warn("Aviso al registrar pago en Supabase:", error);
      }

      onPagoSaved();
      onClose();
    } catch (err: any) {
      console.error("Error al registrar pago:", err);
      setErrorMsg(err.message || "Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-t-3xl md:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/70 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">
                Registrar Cobro / Seña
              </h3>
              <p className="text-xs text-stone-400">
                {reserva.huesped?.nombre_completo || "Huésped"} •{" "}
                {reserva.cabania?.nombre || "Cabaña"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Saldo Pendiente Card & Fast Fill */}
          <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold">
                  Saldo Pendiente Actual
                </span>
                <p
                  className={cn(
                    "text-lg font-bold font-mono",
                    saldoPendiente > 0 ? "text-amber-400" : "text-emerald-400"
                  )}
                >
                  {formatCurrency(saldoPendiente, reserva.moneda)}
                </p>
              </div>

              {saldoPendiente > 0 && (
                <button
                  type="button"
                  onClick={handleCompletarSaldo}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Saldar Total</span>
                </button>
              )}
            </div>

            {/* Input Importe */}
            <div className="relative pt-1">
              <label className="text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Monto a Cobrar ($ {reserva.moneda || "ARS"}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-emerald-400">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-9 pr-4 py-3 text-2xl font-bold text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Pago */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              Tipo de Cobro *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIPOS_PAGO.map((t) => {
                const isSelected = tipoPago === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTipoPago(t.id)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center",
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50 font-bold"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                    )}
                  >
                    <span className="text-xs font-semibold">{t.label}</span>
                    <span className="text-[10px] opacity-75">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cobrado Por */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              ¿Quién recibió el cobro? *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COBRADORES.map((c) => {
                const isSelected = cobradoPor === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCobradoPor(c.id)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer",
                      isSelected
                        ? c.id === "Claudio"
                          ? "bg-blue-600 text-white border-blue-500 shadow-md"
                          : c.id === "Ale"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                          : "bg-amber-600 text-white border-amber-500 shadow-md"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha y Medio de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Fecha de Cobro *
              </label>
              <input
                type="date"
                value={fechaCobro}
                onChange={(e) => setFechaCobro(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-400" />
                Medio de Cobro
              </label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value as MedioPago)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-emerald-500"
              >
                {MEDIOS_PAGO.map((mp) => (
                  <option key={mp.id} value={mp.id} className="bg-stone-900">
                    {mp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas / Cuenta Destino */}
          <div>
            <label className="block text-xs text-stone-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              Cuenta Destino / Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Transferido a Santander Río / Efectivo en sobre recepción..."
              value={cuentaDestino}
              onChange={(e) => setCuentaDestino(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-emerald-500 placeholder:text-stone-600"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-stone-800 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Confirmar Cobro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

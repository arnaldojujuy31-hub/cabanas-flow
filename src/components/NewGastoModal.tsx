"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Receipt,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  FileText,
  Tag,
  Check,
} from "lucide-react";
import {
  Gasto,
  CategoriaGasto,
  AbonadoPor,
  MedioPago,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NewGastoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGastoSaved: () => void;
  gastoToEdit?: Gasto | null;
}

const CATEGORIAS: { name: CategoriaGasto; icon?: string; color: string }[] = [
  { name: "Servicios", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { name: "Limpieza", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { name: "Viáticos Purma", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { name: "Mantenimiento", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { name: "Insumos", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { name: "Blancos", color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  { name: "Comisiones Booking", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { name: "Impuestos", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { name: "Otros", color: "text-stone-400 bg-stone-500/10 border-stone-500/20" },
];

const PAGADORES: { name: AbonadoPor; label: string; desc: string }[] = [
  { name: "Claudio", label: "Claudio", desc: "Socio (50%)" },
  { name: "Ale", label: "Ale", desc: "Socio (50%)" },
  { name: "Caja Central", label: "Caja Central", desc: "Fondo común" },
];

const MEDIOS_PAGO: { id: MedioPago; label: string }[] = [
  { id: "transferencia", label: "Transferencia" },
  { id: "efectivo", label: "Efectivo" },
  { id: "tarjeta", label: "Tarjeta / Débito" },
  { id: "mercadopago", label: "Mercado Pago" },
];

export function NewGastoModal({
  isOpen,
  onClose,
  onGastoSaved,
  gastoToEdit,
}: NewGastoModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fecha, setFecha] = useState("");
  const [categoria, setCategoria] = useState<CategoriaGasto>("Servicios");
  const [detalle, setDetalle] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<"ARS" | "USD">("ARS");
  const [abonadoPor, setAbonadoPor] = useState<AbonadoPor>("Claudio");
  const [medioPago, setMedioPago] = useState<MedioPago>("transferencia");

  useEffect(() => {
    if (isOpen) {
      if (gastoToEdit) {
        setFecha(gastoToEdit.fecha);
        setCategoria((gastoToEdit.categoria as CategoriaGasto) || "Servicios");
        setDetalle(gastoToEdit.detalle || "");
        setMonto(gastoToEdit.monto.toString());
        setMoneda((gastoToEdit.moneda as "ARS" | "USD") || "ARS");
        setAbonadoPor((gastoToEdit.abonado_por as AbonadoPor) || "Claudio");
        setMedioPago((gastoToEdit.medio_pago as MedioPago) || "transferencia");
      } else {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        setFecha(todayStr);
        setCategoria("Servicios");
        setDetalle("");
        setMonto("");
        setMoneda("ARS");
        setAbonadoPor("Claudio");
        setMedioPago("transferencia");
      }
      setErrorMsg(null);
    }
  }, [isOpen, gastoToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorMsg("Por favor ingresa un importe válido mayor a 0.");
      return;
    }
    if (!detalle.trim()) {
      setErrorMsg("Por favor describe el detalle del gasto.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const payload = {
        complejo_id: COMPLEJO_PILOTO_ID,
        fecha: fecha || format(new Date(), "yyyy-MM-dd"),
        categoria,
        detalle: detalle.trim(),
        monto: montoNum,
        moneda,
        abonado_por: abonadoPor,
        medio_pago: medioPago,
      };

      if (gastoToEdit?.id) {
        const { error } = await supabase
          .from("gastos")
          .update(payload)
          .eq("id", gastoToEdit.id);

        if (error) {
          console.warn("Supabase update error:", error);
        }
      } else {
        const { error } = await supabase.from("gastos").insert(payload);
        if (error) {
          console.warn("Supabase insert error:", error);
        }
      }

      onGastoSaved();
      onClose();
    } catch (err: any) {
      console.error("Error al guardar gasto:", err);
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">
                {gastoToEdit ? "Editar Gasto" : "Registrar Nuevo Gasto"}
              </h3>
              <p className="text-xs text-stone-400">
                Cabañas Purmamarca • Rendición de Socios
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Importe y Moneda (Grande para Celular) */}
          <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-500" />
                Importe del Gasto *
              </label>
              {/* Selector Moneda */}
              <div className="flex bg-stone-900 border border-stone-800 rounded-lg p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMoneda("ARS")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                    moneda === "ARS"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-200"
                  )}
                >
                  ARS ($)
                </button>
                <button
                  type="button"
                  onClick={() => setMoneda("USD")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer",
                    moneda === "USD"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "text-stone-400 hover:text-stone-200"
                  )}
                >
                  USD (U$S)
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-amber-500">
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
                className="w-full bg-stone-900/90 border border-stone-700/80 rounded-xl pl-9 pr-4 py-3 text-2xl font-bold text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {/* Abonado Por (Selector de Socios / Caja con botones grandes) */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              ¿Quién abonó el gasto? *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAGADORES.map((p) => {
                const isSelected = abonadoPor === p.name;
                return (
                  <button
                    type="button"
                    key={p.name}
                    onClick={() => setAbonadoPor(p.name)}
                    className={cn(
                      "py-3 px-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                      isSelected
                        ? p.name === "Claudio"
                          ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/50"
                          : p.name === "Ale"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50"
                          : "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/50"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200"
                    )}
                  >
                    <span className="text-xs font-bold">{p.label}</span>
                    <span
                      className={cn(
                        "text-[10px]",
                        isSelected ? "text-white/80" : "text-stone-500"
                      )}
                    >
                      {p.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-500" />
              Categoría del gasto *
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-stone-950/50 rounded-xl border border-stone-800">
              {CATEGORIAS.map((cat) => {
                const isSelected = categoria === cat.name;
                return (
                  <button
                    type="button"
                    key={cat.name}
                    onClick={() => setCategoria(cat.name)}
                    className={cn(
                      "py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                      isSelected
                        ? "bg-amber-600 text-white border-amber-500 shadow-sm font-semibold"
                        : "bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200"
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalle */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              Detalle / Concepto *
            </label>
            <input
              type="text"
              placeholder="Ej. Pago luz EJESA Cabañas, Nafta viaje Purma, Detergente..."
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              required
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
            />
          </div>

          {/* Fecha y Medio de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Fecha del Comprobante *
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-400" />
                Medio de Pago
              </label>
              <select
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value as MedioPago)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              >
                {MEDIOS_PAGO.map((mp) => (
                  <option key={mp.id} value={mp.id} className="bg-stone-900">
                    {mp.label}
                  </option>
                ))}
              </select>
            </div>
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
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{gastoToEdit ? "Guardar Cambios" : "Registrar Gasto"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

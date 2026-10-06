"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Vault,
  DollarSign,
  Calendar,
  User,
  Check,
  FileText,
} from "lucide-react";
import { CobradoPor, COMPLEJO_PILOTO_ID } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NewArqueoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArqueoSaved: () => void;
  currentArs?: number;
  currentUsd?: number;
}

const RESPONSABLES: { id: CobradoPor; label: string }[] = [
  { id: "Claudio", label: "Claudio" },
  { id: "Ale", label: "Ale" },
  { id: "Recepción", label: "Recepción" },
];

export function NewArqueoModal({
  isOpen,
  onClose,
  onArqueoSaved,
  currentArs = 0,
  currentUsd = 0,
}: NewArqueoModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fecha, setFecha] = useState("");
  const [montoArs, setMontoArs] = useState("");
  const [montoUsd, setMontoUsd] = useState("");
  const [responsable, setResponsable] = useState<CobradoPor>("Claudio");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFecha(format(new Date(), "yyyy-MM-dd"));
      setMontoArs(currentArs > 0 ? currentArs.toString() : "");
      setMontoUsd(currentUsd > 0 ? currentUsd.toString() : "");
      setResponsable("Claudio");
      setObservaciones("");
      setErrorMsg(null);
    }
  }, [isOpen, currentArs, currentUsd]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ars = parseFloat(montoArs) || 0;
    const usd = parseFloat(montoUsd) || 0;

    if (ars < 0 || usd < 0) {
      setErrorMsg("Los montos no pueden ser negativos.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const payload = {
        complejo_id: COMPLEJO_PILOTO_ID,
        fecha: fecha || format(new Date(), "yyyy-MM-dd"),
        monto_ars: ars,
        monto_usd: usd,
        responsable,
        observaciones: observaciones.trim() || null,
      };

      const { error } = await supabase.from("arqueos_caja").insert(payload);

      if (error) {
        console.warn("Aviso al guardar arqueo en Supabase:", error);
      }

      onArqueoSaved();
      onClose();
    } catch (err: any) {
      console.error("Error al registrar arqueo:", err);
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
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">
                Nuevo Arqueo de Caja Física
              </h3>
              <p className="text-xs text-stone-400">
                Caja Fuerte / Efectivo en Complejo
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

          {/* Efectivo ARS y USD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ARS */}
            <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 space-y-2">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Efectivo ARS ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-400">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="0"
                  value={montoArs}
                  onChange={(e) => setMontoArs(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-2.5 text-lg font-bold text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* USD */}
            <div className="bg-stone-950/70 p-4 rounded-2xl border border-stone-800 space-y-2">
              <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Efectivo USD (U$S)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-400">
                  U$S
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  placeholder="0"
                  value={montoUsd}
                  onChange={(e) => setMontoUsd(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-12 pr-3 py-2.5 text-lg font-bold text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              Responsable del Conteo *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {RESPONSABLES.map((r) => {
                const isSelected = responsable === r.id;
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setResponsable(r.id)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-center border text-xs font-semibold transition-all cursor-pointer",
                      isSelected
                        ? r.id === "Claudio"
                          ? "bg-blue-600 text-white border-blue-500 shadow-md"
                          : r.id === "Ale"
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                          : "bg-amber-600 text-white border-amber-500 shadow-md"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Fecha del Arqueo *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs text-stone-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-stone-400" />
              Observaciones (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Billetes chicos para cambio en recepción, dólares guardados en caja fuerte..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
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
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Guardar Arqueo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

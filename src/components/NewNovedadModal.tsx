"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  AlertTriangle,
  Home,
  User,
  Calendar,
  FileText,
  Check,
  Wrench,
  Sparkles,
} from "lucide-react";
import {
  Cabania,
  TipoNovedad,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NewNovedadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabanias: Cabania[];
  initialCabaniaId?: string;
  onNovedadSaved: () => void;
}

const TIPOS_NOVEDAD: { id: TipoNovedad; label: string; icon: string }[] = [
  { id: "rotura", label: "Rotura / Daño", icon: "💥" },
  { id: "mantenimiento", label: "Mantenimiento", icon: "🔧" },
  { id: "faltante", label: "Faltante / Reposición", icon: "📦" },
  { id: "blancos", label: "Ropa Blanca / Mancha", icon: "🧺" },
  { id: "otro", label: "Otra observación", icon: "📝" },
];

const REPORTADORES = [
  "Personal de Limpieza",
  "Claudio",
  "Ale",
  "Recepción",
];

export function NewNovedadModal({
  isOpen,
  onClose,
  cabanias,
  initialCabaniaId,
  onNovedadSaved,
}: NewNovedadModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [cabaniaId, setCabaniaId] = useState("");
  const [tipo, setTipo] = useState<TipoNovedad>("rotura");
  const [descripcion, setDescripcion] = useState("");
  const [reportadoPor, setReportadoPor] = useState("Personal de Limpieza");
  const [ponerEnMantenimiento, setPonerEnMantenimiento] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCabaniaId(
        initialCabaniaId || (cabanias.length > 0 ? cabanias[0].id : "")
      );
      setTipo("rotura");
      setDescripcion("");
      setReportadoPor("Personal de Limpieza");
      setPonerEnMantenimiento(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialCabaniaId, cabanias]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabaniaId || !descripcion.trim()) {
      setErrorMsg("Por favor describe la novedad o rotura.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const payload = {
        complejo_id: COMPLEJO_PILOTO_ID,
        cabania_id: cabaniaId,
        fecha: format(new Date(), "yyyy-MM-dd"),
        tipo,
        descripcion: descripcion.trim(),
        resuelto: false,
        reportado_por: reportadoPor,
      };

      const { error } = await supabase.from("tareas_limpieza").insert(payload);
      if (error) {
        console.warn("Aviso al registrar novedad en Supabase:", error);
      }

      // Si se marcó para poner fuera de servicio
      if (ponerEnMantenimiento) {
        await supabase
          .from("cabanias")
          .update({ estado_limpieza: "mantenimiento" })
          .eq("id", cabaniaId);
      }

      onNovedadSaved();
      onClose();
    } catch (err: any) {
      console.error("Error al guardar novedad:", err);
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">
                Reportar Novedad / Rotura
              </h3>
              <p className="text-xs text-stone-400">
                Housekeeping • Cabañas Purmamarca
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

          {/* Cabaña */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-amber-500" />
              Cabaña afectada *
            </label>
            <select
              value={cabaniaId}
              onChange={(e) => setCabaniaId(e.target.value)}
              required
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
            >
              {cabanias.map((c) => (
                <option key={c.id} value={c.id} className="bg-stone-900">
                  {c.nombre} ({c.tipo})
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Novedad */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              Tipo de Incidencia *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_NOVEDAD.map((t) => {
                const isSelected = tipo === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setTipo(t.id)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2",
                      isSelected
                        ? "bg-rose-600/20 text-rose-300 border-rose-500 shadow-sm font-bold"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                    )}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span className="text-xs truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              Detalle de lo ocurrido *
            </label>
            <textarea
              rows={3}
              placeholder="Ej. Foco quemado en el baño principal, rotura de copa de vino en cocina, sábana con mancha rebelde..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-xs focus:outline-none focus:border-amber-500 placeholder:text-stone-600 resize-none"
            />
          </div>

          {/* Reportado por */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-amber-500" />
              ¿Quién reporta? *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REPORTADORES.map((r) => {
                const isSelected = reportadoPor === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setReportadoPor(r)}
                    className={cn(
                      "py-2 px-1 text-center rounded-xl text-xs font-medium border transition-all cursor-pointer truncate",
                      isSelected
                        ? "bg-amber-600 text-white border-amber-500 shadow-sm font-semibold"
                        : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Switch Marcar en Mantenimiento */}
          <div className="bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-200 block">
                  Poner Cabaña Fuera de Servicio
                </span>
                <p className="text-[10px] text-stone-400">
                  Cambia el estado a &quot;Mantenimiento&quot; inmediatamente
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              checked={ponerEnMantenimiento}
              onChange={(e) => setPonerEnMantenimiento(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
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
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-sm shadow-lg shadow-rose-950/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Registrar Reporte</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

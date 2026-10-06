"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Calendar,
  User,
  Phone,
  CreditCard,
  Home,
  Users,
  MapPin,
  FileText,
  DollarSign,
  Check,
} from "lucide-react";
import {
  Cabania,
  OrigenReserva,
  EstadoReserva,
  COMPLEJO_PILOTO_ID,
} from "@/types/database";
import { differenceInCalendarDays, format, parseISO, addDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";

interface NewReservaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabanias: Cabania[];
  initialCabaniaId?: string;
  initialFechaCheckin?: string;
  onReservaCreated: () => void;
}

export function NewReservaModal({
  isOpen,
  onClose,
  cabanias,
  initialCabaniaId,
  initialFechaCheckin,
  onReservaCreated,
}: NewReservaModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [cabaniaId, setCabaniaId] = useState<string>("");
  const [nombreHuesped, setNombreHuesped] = useState("");
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState("");
  const [dni, setDni] = useState("");
  const [ciudadOrigen, setCiudadOrigen] = useState("");
  const [fechaCheckin, setFechaCheckin] = useState("");
  const [fechaCheckout, setFechaCheckout] = useState("");
  const [cantidadPasajeros, setCantidadPasajeros] = useState(2);
  const [origenReserva, setOrigenReserva] = useState<OrigenReserva>("whatsapp");
  const [montoTotal, setMontoTotal] = useState<string>("85000");
  const [montoSenia, setMontoSenia] = useState<string>("0");
  const [notasOperativas, setNotasOperativas] = useState("");

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const defaultIn = initialFechaCheckin || format(today, "yyyy-MM-dd");
      const defaultOut = format(addDays(parseISO(defaultIn), 2), "yyyy-MM-dd");

      setFechaCheckin(defaultIn);
      setFechaCheckout(defaultOut);
      setCabaniaId(
        initialCabaniaId || (cabanias.length > 0 ? cabanias[0].id : "")
      );
      setNombreHuesped("");
      setTelefonoWhatsapp("+54 9 ");
      setDni("");
      setCiudadOrigen("");
      setCantidadPasajeros(2);
      setOrigenReserva("whatsapp");
      setMontoTotal("85000");
      setMontoSenia("0");
      setNotasOperativas("");
      setErrorMsg(null);
    }
  }, [isOpen, initialCabaniaId, initialFechaCheckin, cabanias]);

  if (!isOpen) return null;

  // Calculate nights
  let noches = 1;
  try {
    if (fechaCheckin && fechaCheckout) {
      const diff = differenceInCalendarDays(
        parseISO(fechaCheckout),
        parseISO(fechaCheckin)
      );
      noches = diff > 0 ? diff : 1;
    }
  } catch {
    noches = 1;
  }

  const selectedCabania = cabanias.find((c) => c.id === cabaniaId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabaniaId || !nombreHuesped.trim() || !fechaCheckin || !fechaCheckout) {
      setErrorMsg("Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();

      // 1. Crear o buscar Huésped
      const { data: huespedData, error: huespedError } = await supabase
        .from("huespedes")
        .insert({
          complejo_id: COMPLEJO_PILOTO_ID,
          nombre_completo: nombreHuesped.trim(),
          telefono_whatsapp: telefonoWhatsapp.trim() || null,
          dni_o_pasaporte: dni.trim() || null,
          ciudad_origen: ciudadOrigen.trim() || null,
        })
        .select()
        .single();

      let createdHuespedId = huespedData?.id;

      if (huespedError) {
        // Fallback: Si no se pudo crear en BD (por ejemplo RLS o demo), generamos UUID aleatorio
        console.warn("Aviso al crear huésped en Supabase:", huespedError);
        createdHuespedId = crypto.randomUUID();
      }

      // 2. Crear Reserva
      const totalNum = parseFloat(montoTotal) || 0;
      const seniaNum = parseFloat(montoSenia) || 0;

      const { data: reservaData, error: reservaError } = await supabase
        .from("reservas")
        .insert({
          complejo_id: COMPLEJO_PILOTO_ID,
          cabania_id: cabaniaId,
          huesped_id: createdHuespedId,
          fecha_checkin: fechaCheckin,
          fecha_checkout: fechaCheckout,
          cantidad_noches: noches,
          cantidad_pasajeros: cantidadPasajeros,
          origen_reserva: origenReserva,
          estado: "confirmada" as EstadoReserva,
          monto_total: totalNum,
          moneda: "ARS",
          notas_operativas: notasOperativas.trim() || null,
        })
        .select()
        .single();

      if (reservaError) {
        console.warn("Aviso al crear reserva en Supabase:", reservaError);
      }

      // 3. Registrar Seña si es mayor a 0
      if (seniaNum > 0 && reservaData?.id) {
        await supabase.from("pagos_reservas").insert({
          complejo_id: COMPLEJO_PILOTO_ID,
          reserva_id: reservaData.id,
          fecha_cobro: format(new Date(), "yyyy-MM-dd"),
          tipo_pago: "seña",
          medio_pago: "transferencia",
          monto: seniaNum,
          moneda: "ARS",
        });
      }

      onReservaCreated();
      onClose();
    } catch (err: any) {
      console.error("Error al registrar reserva:", err);
      setErrorMsg(
        err.message || "Ocurrió un error al guardar la reserva. Reintenta."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-stone-900 border border-stone-800 rounded-t-3xl md:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-stone-950/70 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-100">
                Nueva Reserva
              </h3>
              <p className="text-xs text-stone-400">
                Complejo Piloto • Purmamarca
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

          {/* Cabaña Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-amber-500" />
              Cabaña asignada *
            </label>
            <select
              value={cabaniaId}
              onChange={(e) => setCabaniaId(e.target.value)}
              required
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            >
              {cabanias.map((c) => (
                <option key={c.id} value={c.id} className="bg-stone-900 text-stone-100">
                  {c.nombre} ({c.capacidad_maxima} pax)
                </option>
              ))}
            </select>
          </div>

          {/* Fechas de Check-in y Check-out */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Fecha Check-in *
              </label>
              <input
                type="date"
                value={fechaCheckin}
                onChange={(e) => {
                  setFechaCheckin(e.target.value);
                  if (e.target.value >= fechaCheckout) {
                    setFechaCheckout(
                      format(addDays(parseISO(e.target.value), 1), "yyyy-MM-dd")
                    );
                  }
                }}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                Fecha Check-out *
              </label>
              <input
                type="date"
                value={fechaCheckout}
                min={fechaCheckin}
                onChange={(e) => setFechaCheckout(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Indicador de Noches calculadas */}
          <div className="flex items-center justify-between px-3 py-2 bg-stone-950/40 rounded-xl border border-stone-800/80 text-xs">
            <span className="text-stone-400">Duración calculada:</span>
            <span className="font-bold text-amber-400">
              {noches} {noches === 1 ? "noche" : "noches"}
            </span>
          </div>

          {/* Datos del Huésped */}
          <div className="space-y-3 pt-2 border-t border-stone-800/80">
            <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="w-4 h-4 text-amber-500" />
              Datos del Huésped
            </span>

            <div>
              <label className="block text-xs text-stone-400 mb-1">
                Nombre Completo *
              </label>
              <input
                type="text"
                placeholder="Ej. Lucas Fernández"
                value={nombreHuesped}
                onChange={(e) => setNombreHuesped(e.target.value)}
                required
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  WhatsApp / Celular
                </label>
                <input
                  type="tel"
                  placeholder="+54 9 11 1234-5678"
                  value={telefonoWhatsapp}
                  onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1">
                  DNI o Pasaporte
                </label>
                <input
                  type="text"
                  placeholder="Ej. 34.567.890"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  Ciudad de Origen
                </label>
                <input
                  type="text"
                  placeholder="Ej. Salta Capital / CABA"
                  value={ciudadOrigen}
                  onChange={(e) => setCiudadOrigen(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-600"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-400" />
                  Cantidad de Pasajeros
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCabania?.capacidad_maxima || 8}
                  value={cantidadPasajeros}
                  onChange={(e) => setCantidadPasajeros(parseInt(e.target.value) || 1)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Origen y Precios */}
          <div className="space-y-3 pt-2 border-t border-stone-800/80">
            <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-amber-500" />
              Origen y Tarifas
            </span>

            <div>
              <label className="block text-xs text-stone-400 mb-1">
                Canal de Origen
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["whatsapp", "booking", "airbnb", "directo"] as OrigenReserva[]).map(
                  (orig) => (
                    <button
                      type="button"
                      key={orig}
                      onClick={() => setOrigenReserva(orig)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-medium border capitalize transition-all cursor-pointer ${
                        origenReserva === orig
                          ? "bg-amber-600 text-white border-amber-500 shadow-sm"
                          : "bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200"
                      }`}
                    >
                      {orig}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-amber-400" />
                  Monto Total ($ ARS)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={montoTotal}
                  onChange={(e) => setMontoTotal(e.target.value)}
                  required
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-400 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  Seña Inicial Pagada ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={montoSenia}
                  onChange={(e) => setMontoSenia(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2.5 text-stone-100 text-sm font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Notas Operativas */}
          <div className="pt-2 border-t border-stone-800/80">
            <label className="block text-xs text-stone-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-stone-400" />
              Notas u observaciones (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Llega en auto a las 18hs, solicita cuna para bebé..."
              value={notasOperativas}
              onChange={(e) => setNotasOperativas(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-stone-100 text-xs focus:outline-none focus:border-amber-500 placeholder:text-stone-600 resize-none"
            />
          </div>

          {/* Action Buttons */}
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
                  <span>Confirmar Reserva</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

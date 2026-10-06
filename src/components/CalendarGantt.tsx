"use client";

import { useRef, useEffect } from "react";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isToday,
  isWeekend,
  isSameDay,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { Cabania, Reserva } from "@/types/database";
import { cn } from "@/lib/utils";
import { Sparkles, Users, MessageCircle, Globe, Plus } from "lucide-react";

interface CalendarGanttProps {
  currentMonth: Date;
  today: Date;
  cabanias: Cabania[];
  reservas: Reserva[];
  onSelectReserva: (reserva: Reserva) => void;
  onSelectEmptySlot: (cabaniaId: string, fechaStr: string) => void;
}

export function CalendarGantt({
  currentMonth,
  today,
  cabanias,
  reservas,
  onSelectReserva,
  onSelectEmptySlot,
}: CalendarGanttProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayColumnRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Auto-scroll to today column if in current month
  useEffect(() => {
    if (todayColumnRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const todayEl = todayColumnRef.current;
      const offset = todayEl.offsetLeft - container.offsetWidth / 2 + 60;
      container.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
    }
  }, [currentMonth]);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "confirmada":
        return "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500";
      case "checkin":
        return "bg-blue-600 text-white border-blue-500 hover:bg-blue-500";
      case "checkout":
        return "bg-amber-600 text-white border-amber-500 hover:bg-amber-500";
      case "cancelada":
        return "bg-stone-700 text-stone-400 border-stone-600 line-through";
      default:
        return "bg-purple-600 text-white border-purple-500 hover:bg-purple-500";
    }
  };

  const getCleaningBadge = (estado: string) => {
    switch (estado) {
      case "limpia":
        return {
          color: "bg-emerald-500",
          title: "Limpia y lista",
        };
      case "en_limpieza":
        return {
          color: "bg-amber-500 animate-pulse",
          title: "En limpieza",
        };
      case "sucia":
        return {
          color: "bg-rose-500",
          title: "Sucia / Pendiente",
        };
      default:
        return {
          color: "bg-stone-500",
          title: "Repaso",
        };
    }
  };

  return (
    <div className="relative flex flex-col bg-stone-900 border border-stone-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-hidden select-none scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-stone-900"
      >
        <div className="min-w-fit flex flex-col">
          {/* HEADER ROW: Cabin label + Days of the month */}
          <div className="flex border-b border-stone-800 bg-stone-950/90 sticky top-0 z-20">
            {/* Sticky Left Header */}
            <div className="sticky left-0 z-30 w-40 sm:w-48 bg-stone-950 px-3.5 py-3 border-r border-stone-800 flex items-center justify-between shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
              <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Cabañas
              </span>
              <span className="text-[10px] text-stone-500 font-medium">
                {cabanias.length} un.
              </span>
            </div>

            {/* Days Columns */}
            <div className="flex">
              {daysInMonth.map((day) => {
                const isDayToday = isSameDay(day, today);
                const isDayWeekend = isWeekend(day);
                const dayStr = format(day, "d");
                const dayWeek = format(day, "ccccc", { locale: es }).toUpperCase();

                return (
                  <div
                    key={day.toISOString()}
                    ref={isDayToday ? todayColumnRef : undefined}
                    className={cn(
                      "w-12 sm:w-14 shrink-0 py-2 px-1 text-center border-r border-stone-800/80 flex flex-col items-center justify-center transition-colors",
                      isDayWeekend && "bg-stone-900/40",
                      isDayToday &&
                        "bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold"
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] uppercase font-semibold",
                        isDayToday
                          ? "text-amber-400"
                          : isDayWeekend
                          ? "text-stone-400"
                          : "text-stone-500"
                      )}
                    >
                      {dayWeek}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center mt-0.5",
                        isDayToday
                          ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30"
                          : "text-stone-200"
                      )}
                    >
                      {dayStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CABIN ROWS */}
          <div className="divide-y divide-stone-800/80">
            {cabanias.map((cabania) => {
              const cleaning = getCleaningBadge(cabania.estado_limpieza);

              return (
                <div
                  key={cabania.id}
                  className="flex relative hover:bg-stone-800/30 transition-colors group"
                >
                  {/* Sticky Left Cabin Title */}
                  <div className="sticky left-0 z-10 w-40 sm:w-48 bg-stone-900/95 px-3 py-3 border-r border-stone-800 flex flex-col justify-center shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          cleaning.color
                        )}
                        title={cleaning.title}
                      />
                      <h4 className="text-xs font-semibold text-stone-100 truncate">
                        {cabania.nombre}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                        <Users className="w-2.5 h-2.5" />
                        {cabania.capacidad_maxima} pax
                      </span>
                      <span className="text-[10px] text-stone-400 truncate">
                        {cabania.tipo}
                      </span>
                    </div>
                  </div>

                  {/* Days cells */}
                  <div className="flex relative">
                    {daysInMonth.map((day) => {
                      const isDayToday = isSameDay(day, today);
                      const isDayWeekend = isWeekend(day);
                      const dateIso = format(day, "yyyy-MM-dd");

                      // Find if this day falls within any reservation for this cabin
                      const res = reservas.find((r) => {
                        if (r.cabania_id !== cabania.id) return false;
                        try {
                          const inDate = parseISO(r.fecha_checkin);
                          const outDate = parseISO(r.fecha_checkout);
                          // En hotelería el día de checkout suele ser salida por la mañana,
                          // por lo que la estadía efectiva es [inDate, outDate - 1] o [inDate, outDate]
                          return isWithinInterval(day, {
                            start: inDate,
                            end: outDate,
                          });
                        } catch {
                          return false;
                        }
                      });

                      const isCheckinDay =
                        res && isSameDay(parseISO(res.fecha_checkin), day);
                      const isCheckoutDay =
                        res && isSameDay(parseISO(res.fecha_checkout), day);

                      return (
                        <div
                          key={day.toISOString()}
                          onClick={() => {
                            if (res) {
                              onSelectReserva(res);
                            } else {
                              onSelectEmptySlot(cabania.id, dateIso);
                            }
                          }}
                          className={cn(
                            "w-12 sm:w-14 h-14 shrink-0 border-r border-stone-800/60 relative p-1 flex items-center justify-center cursor-pointer transition-colors",
                            isDayWeekend && "bg-stone-950/20",
                            isDayToday && "bg-amber-500/5",
                            !res && "hover:bg-amber-500/10"
                          )}
                        >
                          {res ? (
                            <div
                              className={cn(
                                "w-full h-11 py-1 px-1.5 rounded-lg border text-left shadow-sm flex flex-col justify-center transition-all transform active:scale-95",
                                getStatusColor(res.estado),
                                isCheckinDay && "rounded-l-lg ring-1 ring-white/30",
                                isCheckoutDay && "rounded-r-lg opacity-90"
                              )}
                            >
                              <div className="flex items-center justify-between gap-0.5">
                                <span className="text-[10px] font-bold truncate leading-tight">
                                  {res.huesped?.nombre_completo?.split(" ")[0] ||
                                    "Reserva"}
                                </span>
                                {res.origen_reserva === "whatsapp" && (
                                  <MessageCircle className="w-2.5 h-2.5 shrink-0 opacity-80" />
                                )}
                                {(res.origen_reserva === "booking" ||
                                  res.origen_reserva === "airbnb") && (
                                  <Globe className="w-2.5 h-2.5 shrink-0 opacity-80" />
                                )}
                              </div>
                              <span className="text-[9px] opacity-90 truncate leading-none mt-0.5">
                                {isCheckinDay
                                  ? "🟢 In"
                                  : isCheckoutDay
                                  ? "🏁 Out"
                                  : `${res.cantidad_pasajeros}p`}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Plus className="w-3.5 h-3.5 text-stone-500 hover:text-amber-400" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

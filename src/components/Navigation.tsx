"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarCheck,
  Home,
  Plus,
  Receipt,
  PieChart,
  Sparkles,
  Users,
  Mountain,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  onOpenNewReserva?: () => void;
}

export function Navigation({ onOpenNewReserva }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Ocupación",
      href: "/",
      icon: CalendarDays,
    },
    {
      name: "Reservas",
      href: "/reservas",
      icon: CalendarCheck,
    },
    {
      name: "Consolidado",
      href: "/consolidado",
      icon: PieChart,
    },
    {
      name: "Gastos",
      href: "/gastos",
      icon: Receipt,
    },
    {
      name: "Cabañas",
      href: "/cabanias",
      icon: Home,
    },
    {
      name: "Limpieza",
      href: "/limpieza",
      icon: Sparkles,
    },
    {
      name: "Huéspedes",
      href: "/huespedes",
      icon: Users,
    },
  ];

  return (
    <>
      {/* DESKTOP & TABLET SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 text-stone-100 border-r border-stone-800 shrink-0 h-screen sticky top-0 z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <Mountain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-orange-400 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                CabañasFlow
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium">
              Purmamarca • Jujuy
            </p>
          </div>
        </div>

        {/* Quick Action Button in Sidebar */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => {
              if (onOpenNewReserva) {
                onOpenNewReserva();
              } else {
                window.dispatchEvent(new CustomEvent("open-new-reserva"));
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-950/40 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Nueva Reserva</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                    : "text-stone-300 hover:bg-stone-800/80 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-amber-400" : "text-stone-400"
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Complejo Info */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-amber-500">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-200 truncate">
                Cabañas Purmamarca
              </p>
              <p className="text-[10px] text-stone-400 truncate">
                6 cabañas activas
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-500" />
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-lg border-t border-stone-800/90 pb-safe">
        <div className="flex items-center justify-around px-2 py-1.5 relative">
          {/* Ocupación */}
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-medium transition-all",
              pathname === "/"
                ? "text-amber-400 font-semibold"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <CalendarDays
              className={cn("w-5 h-5 mb-0.5", pathname === "/" && "scale-110")}
            />
            <span>Ocupación</span>
          </Link>

          {/* Cabañas */}
          <Link
            href="/cabanias"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-medium transition-all",
              pathname === "/cabanias"
                ? "text-amber-400 font-semibold"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Home
              className={cn(
                "w-5 h-5 mb-0.5",
                pathname === "/cabanias" && "scale-110"
              )}
            />
            <span>Cabañas</span>
          </Link>

          {/* Central (+) Action Floating Button */}
          <div className="-mt-6 flex flex-col items-center">
            <button
              onClick={() => {
                if (onOpenNewReserva) {
                  onOpenNewReserva();
                } else {
                  window.dispatchEvent(new CustomEvent("open-new-reserva"));
                }
              }}
              aria-label="Nueva Reserva"
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-orange-600 via-amber-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/40 border-4 border-stone-900 active:scale-95 transition-transform"
            >
              <Plus className="w-7 h-7 stroke-[2.5]" />
            </button>
            <span className="text-[10px] font-medium text-amber-300/90 mt-0.5">
              + Reserva
            </span>
          </div>

          {/* Gastos */}
          <Link
            href="/gastos"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-medium transition-all",
              pathname === "/gastos"
                ? "text-amber-400 font-semibold"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Receipt
              className={cn(
                "w-5 h-5 mb-0.5",
                pathname === "/gastos" && "scale-110"
              )}
            />
            <span>Gastos</span>
          </Link>

          {/* Limpieza */}
          <Link
            href="/limpieza"
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[11px] font-medium transition-all",
              pathname === "/limpieza"
                ? "text-amber-400 font-semibold"
                : "text-stone-400 hover:text-stone-200"
            )}
          >
            <Sparkles
              className={cn(
                "w-5 h-5 mb-0.5",
                pathname === "/limpieza" && "scale-110"
              )}
            />
            <span>Limpieza</span>
          </Link>
        </div>
      </div>
    </>
  );
}

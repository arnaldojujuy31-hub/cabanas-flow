export const COMPLEJO_PILOTO_ID = "a0000000-0000-0000-0000-000000000001";

export type EstadoLimpieza =
  | "limpia"
  | "a_limpiar"
  | "sucia"
  | "en_limpieza"
  | "mantenimiento"
  | "repaso";

export type OrigenReserva =
  | "whatsapp"
  | "booking"
  | "airbnb"
  | "directo"
  | "telefono"
  | "otro";

export type EstadoReserva =
  | "pendiente"
  | "confirmada"
  | "checkin"
  | "checkout"
  | "cancelada";

export type TipoPago = "seña" | "saldo" | "total" | "adicional" | "deposito" | string;

export type MedioPago =
  | "efectivo"
  | "transferencia"
  | "mercadopago"
  | "tarjeta"
  | "otro";

export type CobradoPor = "Claudio" | "Ale" | "Recepción" | string;

export interface Cabania {
  id: string;
  complejo_id: string;
  nombre: string;
  tipo: string;
  capacidad_maxima: number;
  estado_limpieza: EstadoLimpieza | string;
  orden_en_grilla: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Huesped {
  id: string;
  complejo_id: string;
  nombre_completo: string;
  dni_o_pasaporte: string | null;
  telefono_whatsapp: string | null;
  email: string | null;
  ciudad_origen: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Reserva {
  id: string;
  complejo_id: string;
  cabania_id: string;
  huesped_id: string;
  fecha_checkin: string; // Formato YYYY-MM-DD
  fecha_checkout: string; // Formato YYYY-MM-DD
  cantidad_noches: number;
  cantidad_pasajeros: number;
  origen_reserva: OrigenReserva | string;
  estado: EstadoReserva | string;
  monto_total: number;
  moneda: string;
  notas_operativas: string | null;
  created_at?: string;
  updated_at?: string;
  // Relaciones opcionales
  huesped?: Huesped;
  cabania?: Cabania;
  pagos?: PagoReserva[];
}

export interface PagoReserva {
  id: string;
  complejo_id: string;
  reserva_id: string;
  fecha_cobro: string;
  tipo_pago: TipoPago;
  medio_pago: MedioPago;
  monto: number;
  moneda: string;
  recibido_por?: CobradoPor | null;
  notas?: string | null;
  cuenta_destino?: string | null;
  created_at?: string;
}

export type CategoriaGasto =
  | "Servicios"
  | "Limpieza"
  | "Viáticos Purma"
  | "Mantenimiento"
  | "Insumos"
  | "Blancos"
  | "Comisiones Booking"
  | "Impuestos"
  | "Otros";

export type AbonadoPor = "Claudio" | "Ale" | "Caja Central";

export interface Gasto {
  id: string;
  complejo_id: string;
  fecha: string; // YYYY-MM-DD
  categoria: CategoriaGasto | string;
  detalle: string;
  monto: number;
  moneda: string;
  abonado_por: AbonadoPor | string;
  medio_pago?: MedioPago | string | null;
  created_at?: string;
}

export interface ArqueoCaja {
  id: string;
  complejo_id: string;
  fecha: string; // YYYY-MM-DD
  monto_ars: number;
  monto_usd: number;
  responsable: CobradoPor | string;
  observaciones?: string | null;
  created_at?: string;
}

export type TipoNovedad = "rotura" | "mantenimiento" | "faltante" | "blancos" | "otro";

export interface TareaLimpieza {
  id: string;
  complejo_id: string;
  cabania_id: string;
  fecha: string; // YYYY-MM-DD
  tipo: TipoNovedad | string;
  descripcion: string;
  resuelto: boolean;
  reportado_por: string;
  created_at?: string;
  cabania?: Cabania;
}

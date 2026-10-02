const TZ = "America/Argentina/Buenos_Aires";

export function formatMoney(amount: number | null, currency: string): string | null {
  if (amount === null) return null;
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatEventDate(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "full", timeStyle: "short", timeZone: TZ }).format(date);
}

export function formatShortDate(date: Date | null): string | null {
  if (!date) return null;
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(date);
}

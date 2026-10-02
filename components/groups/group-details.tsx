import type { Group } from "@/lib/data/groups";
import { formatEventDate, formatMoney } from "@/lib/format";

export function GroupDetails({ group }: { group: Group }) {
  const rows = [
    ["Presupuesto", formatMoney(group.budget, group.currency)],
    ["Cuándo", formatEventDate(group.eventAt)],
    ["Dónde", group.location],
    ["Organiza", group.hostName],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div className="space-y-3">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium first-letter:uppercase">{v}</dd>
          </div>
        ))}
      </dl>
      {group.notes ? <p className="whitespace-pre-line rounded-md bg-muted p-3 text-sm">{group.notes}</p> : null}
    </div>
  );
}

export function StatusBadge({ group }: { group: Group }) {
  return group.status === "sorteado" ? (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Sorteado</span>
  ) : (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Esperando el sorteo</span>
  );
}

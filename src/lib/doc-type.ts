export type DocTypeInfo = { type: "svidetelstvo" | "udostoverenie" | "diplom"; label: string; short: string };

const LABELS: Record<DocTypeInfo["type"], { label: string; short: string }> = {
  svidetelstvo: { label: "Свидетельство об обучении", short: "Свидетельство" },
  udostoverenie: { label: "Удостоверение о повышении квалификации", short: "Удостоверение" },
  diplom: { label: "Диплом о профессиональной переподготовке", short: "Диплом" },
};

export function getDocType(c: { document_type?: string | null; duration?: string | null; hours?: number | null }): DocTypeInfo | null {
  const t = c.document_type as DocTypeInfo["type"] | null | undefined;
  if (t && LABELS[t]) return { type: t, ...LABELS[t] };
  const hours = c.hours ?? Number(c.duration?.match(/(\d+)\s*ч/i)?.[1] ?? NaN);
  if (!Number.isFinite(hours)) return null;
  if (hours >= 250) return { type: "diplom", ...LABELS.diplom };
  if (hours >= 16) return { type: "udostoverenie", ...LABELS.udostoverenie };
  return { type: "svidetelstvo", ...LABELS.svidetelstvo };
}

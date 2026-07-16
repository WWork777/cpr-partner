import { Check, ListChecks } from "lucide-react";

type Block =
  | { kind: "para"; text: string }
  | { kind: "list"; heading?: string; items: string[] };

function parse(input: string): Block[] {
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const blocks: Block[] = [];
  let i = 0;
  const bulletRe = /^([-—•*]|\d+[.)])\s+/;
  const stripBullet = (s: string) => s.replace(bulletRe, "").replace(/[;.]\s*$/, "").trim();
  const isItemLine = (s: string) =>
    bulletRe.test(s) || s.endsWith(";") || (s.length < 140 && /^[а-яa-z]/.test(s) && !s.endsWith(":") && !s.endsWith("."));

  while (i < lines.length) {
    const line = lines[i];
    // Heading line ending with ":"
    if (line.endsWith(":") && line.length < 140) {
      const heading = line.replace(/:$/, "");
      const items: string[] = [];
      i++;
      while (i < lines.length && isItemLine(lines[i])) {
        items.push(stripBullet(lines[i]));
        i++;
      }
      // Если предыдущие пункты заканчивались на ";", финальный пункт списка
      // обычно заканчивается на "." — подхватим его как часть того же списка.
      if (items.length > 0 && i < lines.length) {
        const next = lines[i];
        const looksLikeFinalItem =
          next.length < 200 &&
          next.endsWith(".") &&
          !next.endsWith(":") &&
          !/^[A-ZА-ЯЁ][^.]{0,40}:/.test(next);
        if (looksLikeFinalItem) {
          items.push(stripBullet(next));
          i++;
        }
      }
      if (items.length > 0) {
        blocks.push({ kind: "list", heading, items });
      } else {
        blocks.push({ kind: "para", text: heading });
      }
      continue;
    }
    // Standalone bullet group
    if (bulletRe.test(line)) {
      const items: string[] = [];
      while (i < lines.length && bulletRe.test(lines[i])) {
        items.push(stripBullet(lines[i]));
        i++;
      }
      blocks.push({ kind: "list", items });
      continue;
    }
    blocks.push({ kind: "para", text: line });
    i++;
  }
  return blocks;
}

export function RichDescription({ text }: { text: string }) {
  const blocks = parse(text);
  return (
    <div className="mt-6 space-y-5">
      {blocks.map((b, idx) =>
        b.kind === "para" ? (
          <p key={idx} className="text-base md:text-lg leading-relaxed text-foreground/85">
            {b.text}
          </p>
        ) : (
          <div key={idx} className="rounded-2xl bg-card p-6 shadow-soft">
            {b.heading && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <ListChecks className="h-4 w-4" />
                </div>
                <div className="font-semibold text-lg">{b.heading}</div>
              </div>
            )}
            <ul className="grid gap-2 sm:grid-cols-2">
              {b.items.map((it, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2.5 rounded-xl bg-muted/40 px-3 py-2.5 text-sm leading-snug"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  );
}

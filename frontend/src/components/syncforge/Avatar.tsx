import { cn } from "@/lib/utils";

const PALETTE = [
  "#C8882A",
  "#5A8FB8",
  "#9B7FB6",
  "#8DB3A0",
  "#C07845",
  "#C8A84B",
  "#A0402E",
  "#6B635A",
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

interface Props {
  name: string;
  initials?: string;
  size?: 20 | 24 | 28 | 36 | 48;
  online?: boolean;
  className?: string;
}

export function Avatar({ name, initials, size = 28, online, className }: Props) {
  const text = initials ?? name.slice(0, 2).toUpperCase();
  const bg = hashColor(name);
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full text-white font-medium select-none",
        className,
      )}
      style={{ width: size, height: size, background: bg, fontSize: Math.max(10, size * 0.38) }}
    >
      {text}
      {online !== undefined && (
        <span
          className="absolute bottom-0 right-0 rounded-full"
          style={{
            width: 6,
            height: 6,
            background: online ? "var(--positive)" : "var(--ink-muted)",
            boxShadow: "0 0 0 1.5px var(--surface-raised)",
          }}
        />
      )}
    </span>
  );
}

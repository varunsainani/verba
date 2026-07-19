// Literal class strings so Tailwind's content scan keeps them in the build.
export interface Accent {
  chip: string;
  solid: string;
  ring: string;
}

export const ACCENTS: Record<string, Accent> = {
  brand: {
    chip: "bg-brand-100 text-brand-700 dark:bg-brand-600/25 dark:text-brand-200",
    solid: "bg-brand-600",
    ring: "ring-brand-500",
  },
  emerald: {
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    solid: "bg-emerald-600",
    ring: "ring-emerald-500",
  },
  rose: {
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    solid: "bg-rose-600",
    ring: "ring-rose-500",
  },
  amber: {
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    solid: "bg-amber-500",
    ring: "ring-amber-500",
  },
  sky: {
    chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    solid: "bg-sky-600",
    ring: "ring-sky-500",
  },
  violet: {
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    solid: "bg-violet-600",
    ring: "ring-violet-500",
  },
};

export const ACCENT_KEYS = Object.keys(ACCENTS);

export function accent(color: string): Accent {
  return ACCENTS[color] ?? ACCENTS.brand;
}

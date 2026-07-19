import { cn } from "./ui";

// Verba mark: a speech bubble made of stacked "document" lines, tying together
// documents + chat. Uses currentColor so it inherits text color.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" className="fill-brand-600" />
      <path
        d="M8 11.5C8 10.67 8.67 10 9.5 10h13c.83 0 1.5.67 1.5 1.5v7c0 .83-.67 1.5-1.5 1.5H14l-4 3.2V20H9.5C8.67 20 8 19.33 8 18.5v-7Z"
        className="fill-white"
      />
      <path
        d="M11 13.2h10M11 16h6.5"
        stroke="#4f46e5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        Verba
      </span>
    </span>
  );
}

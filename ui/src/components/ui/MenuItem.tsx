import type { ButtonHTMLAttributes, Ref } from "react";
import { cn } from "./cn";

export function MenuItem({ active = false, danger = false, size = "default", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; danger?: boolean; size?: "default" | "compact"; ref?: Ref<HTMLButtonElement> }) {
  return (
    <button
      className={cn(
        "model-item flex w-full items-center justify-between gap-2 rounded-md px-2 text-start text-text transition-[background,color] duration-120 ease-standard hover:bg-surface focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent-red focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-45 [&_.model-id]:block [&_.model-id]:text-xs [&_.model-id]:text-muted",
        size === "compact" ? "min-h-8 py-0.5 text-menu" : "min-h-9 py-1.5 text-sm",
        active && "bg-surface",
        danger && "text-accent-red hover:text-accent-red",
        className,
      )}
      {...props}
    />
  );
}

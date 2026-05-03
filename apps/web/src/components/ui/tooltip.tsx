import type { ReactNode } from "react";

export function Tooltip({ children }: { children: ReactNode }) {
  return <span className="underline decoration-dotted">{children}</span>;
}

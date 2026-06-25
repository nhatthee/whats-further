import type { ReactNode } from "react";

export function DustOverlay({
  enabled = false,
  children,
}: {
  enabled?: boolean;
  children: ReactNode;
}) {
  // TODO: Implement Dust Overlay V1
  return <>{children}</>;
}

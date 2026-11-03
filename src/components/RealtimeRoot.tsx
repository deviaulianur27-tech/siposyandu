"use client";

import { useState, type ReactNode } from "react";
import { createRealtimeClient } from "@neon/realtime/client";
import { RealtimeProvider } from "@neon/realtime-react";

/**
 * Satu RealtimeClient untuk seluruh aplikasi. Dibuat di dalam React tree
 * supaya tidak pernah membuka WebSocket saat server render.
 */
export default function RealtimeRoot({ children }: { children: ReactNode }) {
  const [client] = useState(() =>
    createRealtimeClient({
      url: process.env.NEXT_PUBLIC_NEON_REALTIME_URL ?? "",
    }),
  );

  return <RealtimeProvider client={client}>{children}</RealtimeProvider>;
}

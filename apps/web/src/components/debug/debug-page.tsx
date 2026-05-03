"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/constants";

export function DebugPage() {
  const [text, setText] = useState("Loading…");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((j) => setText(JSON.stringify(j)))
      .catch(() => setText("API unreachable"));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Debug</h1>
      <p className="text-sm text-slate-600">API health: {text}</p>
      <p className="text-xs text-slate-500">
        Full execution table UI can list recent executions via future <code>/api/debug/executions</code>.
      </p>
    </div>
  );
}

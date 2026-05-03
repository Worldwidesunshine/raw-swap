"use client";

const CHAINS = [
  { id: "solana", label: "Solana" },
  { id: "ethereum", label: "Ethereum" },
  { id: "base", label: "Base" },
  { id: "arbitrum", label: "Arbitrum" },
] as const;

export function ChainSelector(props: {
  id?: string;
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const selectId = props.id ?? "bridge-chain";
  return (
    <label
      htmlFor={selectId}
      className="flex flex-col gap-1.5 text-xs font-mono text-slate-400"
    >
      Source chain
      <select
        id={selectId}
        className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-slate-200 disabled:cursor-not-allowed disabled:opacity-45"
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {CHAINS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}

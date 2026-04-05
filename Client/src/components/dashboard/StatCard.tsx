import type { ElementType } from "react";

type StatCardProps = {
  icon: ElementType;
  label: string;
  value: string | number;
  accent?: string;
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center justify-between">
      <div>
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${accent ?? "text-white"}`}>
          {value}
        </p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

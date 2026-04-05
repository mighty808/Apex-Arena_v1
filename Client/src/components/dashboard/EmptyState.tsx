import type { ElementType } from "react";
import { Link } from "react-router-dom";

type EmptyStateProps = {
  icon: ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mb-4">{description}</p>
      <Link
        to={actionTo}
        className="px-5 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

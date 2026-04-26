import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="relative overflow-hidden bg-slate-900 border-b border-slate-800">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-indigo-600/8 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[48px_48px]" />
        <div className="relative px-6 py-7 sm:px-8 flex flex-col items-center text-center gap-3 sm:flex-row sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-slate-400">Stay up to date with your tournament activity.</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-6">
        <div className="px-6 sm:px-0">
          {/* Coming soon */}
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 py-20 px-6 text-center">
            <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="font-display text-xl font-semibold text-slate-400">Coming soon</p>
            <p className="text-sm text-slate-600 mt-2">
              Notifications aren't available yet — we're working on it.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

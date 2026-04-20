import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, CheckCircle2, Clock3, Loader2,
  Send, X, DollarSign,
} from "lucide-react";
import { organizerService, type PayoutRequest } from "../../../services/organizer.service";

const NETWORKS = ["MTN", "Vodafone", "AirtelTigo"] as const;

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-500/15 text-amber-300",
  approved:  "bg-emerald-500/15 text-emerald-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  rejected:  "bg-red-500/15 text-red-300",
  cancelled: "bg-slate-600/20 text-slate-400",
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PayoutsPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New request form
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [momoNumber, setMomoNumber] = useState("");
  const [network, setNetwork] = useState<typeof NETWORKS[number]>("MTN");
  const [accountName, setAccountName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await organizerService.getMyPayoutRequests();
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(null); }
    else { setSuccess(msg); setError(null); }
    setTimeout(() => { setSuccess(null); setError(null); }, 5000);
  };

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1) { showMsg("Enter a valid amount (min GHS 1).", true); return; }
    if (!momoNumber.trim()) { showMsg("Enter your mobile money number.", true); return; }
    if (!accountName.trim()) { showMsg("Enter account holder name.", true); return; }
    setSubmitting(true);
    try {
      await organizerService.requestPayout({
        amountGhs: amt,
        requestType: "wallet_withdrawal",
        momoNumber: momoNumber.trim(),
        network,
        accountName: accountName.trim(),
        notes: notes.trim() || undefined,
      });
      showMsg("Payout request submitted. Processing typically takes 1-3 business days.");
      setShowForm(false);
      setAmount(""); setMomoNumber(""); setAccountName(""); setNotes("");
      void load();
    } catch (e) {
      showMsg(e instanceof Error ? e.message : "Request failed.", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-cyan-400" /> Payouts
          </h1>
          <p className="text-sm text-slate-400 mt-1">Request and track your withdrawal requests.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors">
          <Send className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /><span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4 opacity-60" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /><span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4 opacity-60" /></button>
        </div>
      )}

      {/* New request form */}
      {showForm && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">New Payout Request</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Amount (GHS)</label>
              <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 100"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Network</label>
              <select value={network} onChange={e => setNetwork(e.target.value as typeof NETWORKS[number])}
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                {NETWORKS.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Mobile Money Number</label>
              <input value={momoNumber} onChange={e => setMomoNumber(e.target.value)} placeholder="e.g. 0241234567"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Account Holder Name</label>
              <input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full name on MoMo"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for the request"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500" />
          </div>
          <button onClick={() => { void submit(); }} disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      )}

      {/* Request list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="font-semibold text-white text-sm">Request History</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center gap-2">
            <Clock3 className="w-8 h-8 text-slate-600" />
            <p className="text-sm text-slate-500">No payout requests yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {requests.map(req => (
              <div key={req.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white">GHS {req.amountGhs.toFixed(2)}</p>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[req.status] ?? "bg-slate-700/60 text-slate-400"}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {req.network} · {req.momoNumber} · {req.accountName}
                  </p>
                  {req.notes && <p className="text-xs text-slate-500 mt-0.5 italic">"{req.notes}"</p>}
                  {req.rejectionReason && (
                    <p className="text-xs text-red-400 mt-1">Rejected: {req.rejectionReason}</p>
                  )}
                </div>
                <p className="text-xs text-slate-500 shrink-0">{fmtDate(req.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

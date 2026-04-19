import { useCallback, useEffect, useState } from 'react';
import {
  Gamepad2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
} from 'lucide-react';
import { adminService, type GameRequest } from '../../services/admin.service';

const inputCls =
  'w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors';
const selectCls =
  'bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  approved: 'bg-green-500/15 text-green-300',
  rejected: 'bg-red-500/15 text-red-300',
  duplicate: 'bg-slate-700 text-slate-300',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

export default function GameRequests() {
  const [requests, setRequests] = useState<GameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [duplicateOf, setDuplicateOf] = useState('');
  const [actionError, setActionError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.fetchGameRequests(filterStatus || undefined);
      setRequests(data);
    } catch {
      setError('Failed to load game requests.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'reject' && !notes.trim()) { setActionError('Notes are required when rejecting.'); return; }
    setActionError('');
    setReviewingId(id);
    const ok = await adminService.reviewGameRequest(id, action, notes || undefined);
    setReviewingId(null);
    if (ok) {
      setExpandedId(null);
      setNotes('');
      loadRequests();
    } else {
      setActionError(`Failed to ${action} request.`);
    }
  };

  const handleMarkDuplicate = async (id: string) => {
    if (!duplicateOf.trim()) { setActionError('Provide the ID of the original request.'); return; }
    setActionError('');
    setDuplicatingId(id);
    const ok = await adminService.markGameRequestDuplicate(id, duplicateOf.trim());
    setDuplicatingId(null);
    if (ok) {
      setExpandedId(null);
      setDuplicateOf('');
      loadRequests();
    } else {
      setActionError('Failed to mark as duplicate.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/15 p-2.5 rounded-xl">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Game Requests</h1>
            <p className="text-sm text-slate-400">Review community requests for new game support</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="duplicate">Duplicate</option>
          </select>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && !error && requests.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Gamepad2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No game requests found</p>
        </div>
      )}

      {/* List */}
      {!loading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const expanded = expandedId === req.id;
            return (
              <div
                key={req.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
                  onClick={() => { setExpandedId(expanded ? null : req.id); setActionError(''); }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{req.gameName}</span>
                        {req.genre && <span className="text-slate-500 text-xs capitalize">{req.genre}</span>}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        by {req.username} · {formatDate(req.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {req.upvoteCount}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[req.status] ?? 'bg-slate-700 text-slate-300'}`}>
                      {req.status}
                    </span>
                    {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {expanded && (
                  <div className="px-5 pb-5 border-t border-slate-800 space-y-4">
                    {req.description && (
                      <p className="text-slate-400 text-sm mt-3 leading-relaxed">{req.description}</p>
                    )}

                    {req.platform && req.platform.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {req.platform.map((p) => (
                          <span key={p} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-md capitalize">{p}</span>
                        ))}
                      </div>
                    )}

                    {req.duplicateOfId && (
                      <div className="text-xs text-slate-500">
                        Duplicate of: <span className="text-slate-300 font-mono">{req.duplicateOfId}</span>
                      </div>
                    )}

                    {actionError && (
                      <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" /> {actionError}
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1.5 block">Admin Notes (optional for approve, required for reject)</label>
                          <input
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className={inputCls}
                            placeholder="Notes..."
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleReview(req.id, 'approve')}
                            disabled={reviewingId === req.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {reviewingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(req.id, 'reject')}
                            disabled={reviewingId === req.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {reviewingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Reject
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            value={duplicateOf}
                            onChange={(e) => setDuplicateOf(e.target.value)}
                            className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                            placeholder="Original request ID..."
                          />
                          <button
                            onClick={() => handleMarkDuplicate(req.id)}
                            disabled={duplicatingId === req.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors disabled:opacity-50 shrink-0"
                          >
                            {duplicatingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                            Mark Duplicate
                          </button>
                        </div>
                      </div>
                    )}

                    {req.adminNotes && (
                      <div className="p-3 bg-slate-800/60 rounded-lg text-xs text-slate-400">
                        <span className="text-slate-500 font-medium">Admin Notes: </span>{req.adminNotes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

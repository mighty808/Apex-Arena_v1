import { Link } from "react-router-dom";
import { Search, ArrowRight, LifeBuoy, ShieldCheck } from "lucide-react";

const FAQS = [
  {
    q: "How do payouts work?",
    a: "Prize pools are escrowed before brackets open. Once results are verified, payouts go straight to Mobile Money.",
  },
  {
    q: "Can I report a no-show?",
    a: "Yes. Submit evidence within 30 minutes of match time to trigger a no-show review.",
  },
  {
    q: "How do I join a tournament?",
    a: "Create a profile, pick a bracket, and check in before the match lock time.",
  },
  {
    q: "What if my match disconnects?",
    a: "Report immediately with screenshots. Moderators review reconnection rules per title.",
  },
];

const HelpCenter = () => {
  return (
    <div className="bg-slate-950 text-white">
      <section className="border-b border-slate-800/70">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Help Center
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Answers, guides, and support in one place
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Search for help or browse the most common questions from players and
            organizers.
          </p>

          <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-slate-400">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search help topics</span>
            </div>
            <input
              type="text"
              placeholder="Payments, dispute, check-in, brackets..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-semibold text-white">Top questions</h2>
            <div className="mt-6 space-y-4">
              {FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <p className="text-sm font-semibold text-white">{faq.q}</p>
                  <p className="mt-2 text-sm text-slate-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <LifeBuoy className="h-5 w-5 text-cyan-300" />
              <h3 className="mt-4 text-xl font-semibold text-white">
                Need real-time help?
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                During live tournaments, reach moderators through the lobby chat
                or the dispute form.
              </p>
              <Link
                to="/support/dispute-resolution"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300"
              >
                Go to dispute flow
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <h3 className="mt-4 text-xl font-semibold text-white">
                Fair play policies
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Read the official Apex Arenas rules so you know exactly what is
                required before your next match.
              </p>
              <Link
                to="/support/rules"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"
              >
                View rules
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HelpCenter;

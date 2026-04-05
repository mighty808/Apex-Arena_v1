import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

const PaymentSuccess = () => {
  return (
    <section className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-16 sm:px-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.15),transparent_48%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.12),transparent_55%)]" />

      <div className="w-full rounded-3xl border border-white/15 bg-slate-900/65 p-6 backdrop-blur sm:p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-400" />

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
          Payment
        </p>

        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Payment Successful
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
          Your prize pool deposit was completed. Your tournament will open for
          registration once the payment is confirmed by our system.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth/organizer/tournaments"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
          >
            View My Tournaments
          </Link>

          <Link
            to="/auth"
            className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/40 hover:bg-white/5"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PaymentSuccess;

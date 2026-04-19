import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../../lib/auth-context";
import { ApiRequestError, authService } from "../../services/auth.service";
import { apiGet } from "../../utils/api.utils";
import { AUTH_ENDPOINTS } from "../../config/api.config";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const reduceMotion = useReducedMotion();

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const email = (query.get("email") ?? "").trim();
  const nextPath =
    (query.get("next") ?? query.get("redirect") ?? "/login").trim() || "/login";

  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // On mount: check backend cooldown so we show the real wait time
  useEffect(() => {
    if (!email) return;
    const otpType = "email_verification";
    const url = AUTH_ENDPOINTS.OTP_CAN_REQUEST.replace(":type", otpType);
    apiGet(`${url}?email=${encodeURIComponent(email)}`, { skipAuth: true })
      .then((res) => {
        if (!res.success) return;
        const data = res.data as Record<string, unknown>;
        if (!data.allowed && data.wait_seconds) {
          setSecondsLeft(Math.ceil(Number(data.wait_seconds)));
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const focusIndex = (index: number) => {
    const el = inputRefs.current[index];
    if (!el) return;
    el.focus();
    el.select();
  };

  const setFromIndex = (startIndex: number, raw: string) => {
    const onlyDigits = raw.replace(/\D/g, "");
    if (!onlyDigits) return;

    setDigits((prev) => {
      const next = [...prev];
      let writeIndex = startIndex;
      for (const ch of onlyDigits) {
        if (writeIndex >= OTP_LENGTH) break;
        next[writeIndex] = ch;
        writeIndex++;
      }
      const nextFocus = Math.min(writeIndex, OTP_LENGTH - 1);
      queueMicrotask(() => focusIndex(nextFocus));
      return next;
    });
  };

  const handleChange =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (error) setError("");
      if (info) setInfo("");

      const value = e.target.value;
      if (!value) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
        return;
      }

      // If user types/pastes multiple chars into one box, distribute.
      if (value.length > 1) {
        setFromIndex(index, value);
        return;
      }

      const digit = value.replace(/\D/g, "");
      if (!digit) return;

      setDigits((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });

      if (index < OTP_LENGTH - 1) {
        queueMicrotask(() => focusIndex(index + 1));
      }
    };

  const handleKeyDown =
    (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        setDigits((prev) => {
          const next = [...prev];
          if (next[index]) {
            next[index] = "";
            queueMicrotask(() => focusIndex(index));
          } else if (index > 0) {
            next[index - 1] = "";
            queueMicrotask(() => focusIndex(index - 1));
          }
          return next;
        });
        return;
      }

      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusIndex(index - 1);
        return;
      }

      if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        e.preventDefault();
        focusIndex(index + 1);
        return;
      }
    };

  const handlePaste =
    (index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text");
      setFromIndex(index, text);
    };

  const code = digits.join("");
  const isComplete = code.length === OTP_LENGTH && /^\d{6}$/.test(code);

  const handleResend = async () => {
    if (secondsLeft > 0) return;

    if (!email) {
      setError("Missing email. Return to sign up and try again.");
      return;
    }

    setIsResending(true);
    setError("");
    setInfo("");

    try {
      const result = await authService.resendOtp(email);
      setInfo(result.message ?? "A new verification code has been sent.");
      setSecondsLeft(RESEND_SECONDS);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setError(error.message);
      } else {
        setError("Could not resend code. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!email) {
      setError("Missing email. Return to sign up and try again.");
      return;
    }

    if (!isComplete) {
      setError("Enter the 6-digit code.");
      focusIndex(0);
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.verifyOtp({ email, otp: code });

      if (result.tokens?.accessToken) {
        setSession(result.tokens, result.user ?? null);
      }

      if (result.message) {
        setInfo(result.message);
      }

      navigate(nextPath);
    } catch (error) {
      if (error instanceof ApiRequestError) {
        const friendlyMessages: Record<string, string> = {
          OTP_EXPIRED: "This code has expired. Please request a new one.",
          OTP_INVALID: "Incorrect code. Please check and try again.",
          OTP_MAX_ATTEMPTS: "Too many attempts. Please request a new code.",
          ALREADY_VERIFIED: "Your email is already verified. You can log in now.",
        };
        setError(friendlyMessages[error.code] ?? error.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center text-white py-12 px-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 60% 50% at -10% 0%, rgba(249,115,22,0.12), transparent)"}} />
      <div className="absolute inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse 50% 60% at 110% 100%, rgba(139,92,246,0.10), transparent)"}} />
      <div className="absolute inset-0 pointer-events-none" style={{backgroundImage:"linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)",backgroundSize:"48px 48px"}} />
      <div className="relative w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-900/75 backdrop-blur-sm shadow-2xl shadow-black/50 p-8 font-body"
        autoComplete="off"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white p-0.5 shrink-0">
              <img src="/apex-logo.png" alt="Apex Arenas" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-lg text-white">
              APEX ARENAS
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="font-display text-3xl font-bold text-center text-white">
            Verify Code
          </h1>
        </div>

        <p className="text-center text-slate-300 text-sm mb-6">
          Enter the 6-digit code
          {email ? (
            <span className="inline-flex items-center gap-2">
              {" "}
              sent to
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950/40 px-2 py-1 text-slate-100">
                <Mail className="w-4 h-4 text-slate-300" />
                <span className="font-medium">{email}</span>
              </span>
            </span>
          ) : (
            "."
          )}
        </p>

        <div className="flex justify-center gap-2 mb-4">
          {digits.map((value, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={value}
              onChange={handleChange(i)}
              onKeyDown={handleKeyDown(i)}
              onPaste={handlePaste(i)}
              className={`w-11 h-12 text-center text-lg rounded-lg border ${
                error ? "border-red-500" : "border-slate-700"
              } bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent`}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
        )}
        {info && (
          <p className="text-emerald-200 text-sm text-center mb-3">{info}</p>
        )}

        <motion.button
          type="submit"
          disabled={isLoading}
          className="mt-2 w-full py-3 rounded-lg bg-gradient-to-r from-orange-400 to-amber-400 text-slate-950 font-semibold text-base shadow hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={reduceMotion || isLoading ? undefined : { y: -1 }}
          whileTap={reduceMotion || isLoading ? undefined : { scale: 0.98 }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Verifying...
            </span>
          ) : (
            "Verify"
          )}
        </motion.button>

        <div className="mt-6 flex items-center justify-between">
          <motion.button
            type="button"
            onClick={handleResend}
            disabled={secondsLeft > 0 || isResending}
            className="text-sm text-cyan-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            whileTap={
              reduceMotion || secondsLeft > 0 || isResending
                ? undefined
                : { scale: 0.98 }
            }
          >
            {isResending
              ? "Resending..."
              : secondsLeft > 0
                ? `Resend in ${secondsLeft}s`
                : "Resend code"}
          </motion.button>

          <Link to="/login" className="text-sm text-slate-300 hover:text-white">
            Back to login
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
};

export default VerifyOtp;

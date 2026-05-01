import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import "react-day-picker/style.css";

interface DateTimePickerProps {
  value: string;          // "YYYY-MM-DDTHH:mm"
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

function parseLocal(v: string): Date | null {
  if (!v) return null;
  const d = parse(v, "yyyy-MM-dd'T'HH:mm", new Date());
  return isValid(d) ? d : null;
}

function toLocal(d: Date, h: number, m: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${format(d, "yyyy-MM-dd")}T${pad(h)}:${pad(m)}`;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time",
  className = "",
}: DateTimePickerProps) {
  const parsed  = parseLocal(value);
  const [open, setOpen]   = useState(false);
  const [month, setMonth] = useState<Date>(parsed ?? new Date());
  const [hour, setHour]   = useState(parsed ? parsed.getHours()   : 12);
  const [minute, setMinute] = useState(parsed ? parsed.getMinutes() : 0);
  const [selected, setSelected] = useState<Date | undefined>(parsed ?? undefined);
  const ref = useRef<HTMLDivElement>(null);

  // Keep internal state in sync when value prop changes from outside
  useEffect(() => {
    const d = parseLocal(value);
    if (d) {
      setSelected(d);
      setMonth(d);
      setHour(d.getHours());
      setMinute(d.getMinutes());
    } else {
      setSelected(undefined);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const emit = (day: Date, h: number, m: number) => {
    onChange(toLocal(day, h, m));
  };

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    setSelected(day);
    emit(day, hour, minute);
  };

  const handleHour = (h: number) => {
    setHour(h);
    if (selected) emit(selected, h, minute);
  };

  const handleMinute = (m: number) => {
    setMinute(m);
    if (selected) emit(selected, hour, m);
  };

  const displayValue = selected
    ? `${format(selected, "MMM d, yyyy")}  ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    : "";

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 bg-slate-800/50 border rounded-xl px-4 py-2.5 text-sm transition-colors text-left ${
          open
            ? "border-orange-500/70 bg-slate-800"
            : "border-slate-700 hover:border-slate-600"
        }`}
      >
        <CalendarDays className="w-4 h-4 text-slate-500 shrink-0" />
        <span className={displayValue ? "text-white" : "text-slate-500"}>
          {displayValue || placeholder}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 mt-2 left-0 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden min-w-[300px]">
          {/* Calendar */}
          <div className="p-3">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleDaySelect}
              month={month}
              onMonthChange={setMonth}
              classNames={{
                root:         "text-white select-none",
                months:       "flex flex-col",
                month:        "space-y-2",
                month_caption: "flex items-center justify-between px-1 py-1",
                caption_label: "text-sm font-semibold text-white",
                nav:          "flex items-center gap-1",
                button_previous: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors",
                button_next:     "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors",
                weeks:        "space-y-1",
                weekdays:     "flex",
                weekday:      "w-9 text-center text-[11px] font-semibold text-slate-500 uppercase",
                week:         "flex",
                day:          "w-9 h-9",
                day_button:   "w-9 h-9 rounded-lg text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center",
                selected:     "bg-orange-500 text-white rounded-lg",
                today:        "font-bold text-orange-400",
                outside:      "opacity-30",
                disabled:     "opacity-20 cursor-not-allowed",
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left"
                    ? <ChevronLeft className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />,
              }}
            />
          </div>

          {/* Time picker */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-800 bg-slate-900/80">
            <Clock className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Time</span>
            <div className="flex items-center gap-1 ml-auto">
              {/* Hour */}
              <select
                value={hour}
                onChange={(e) => handleHour(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500 w-16 text-center appearance-none"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                ))}
              </select>
              <span className="text-slate-400 font-bold">:</span>
              {/* Minute */}
              <select
                value={minute}
                onChange={(e) => handleMinute(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500 w-16 text-center appearance-none"
              >
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Confirm */}
          <div className="px-4 py-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

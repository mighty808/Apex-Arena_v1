import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarDays, Clock, X } from 'lucide-react';

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
}

function toLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseValue(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
}

export function DateTimePicker({ value, onChange, placeholder = 'Pick date & time', minDate }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [hour, setHour] = useState(() => parseValue(value)?.getHours() ?? 12);
  const [minute, setMinute] = useState(() => parseValue(value)?.getMinutes() ?? 0);
  const ref = useRef<HTMLDivElement>(null);
  const selected = parseValue(value);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setOpenUpward(window.innerHeight - rect.bottom < 480);
    }
  }, [open]);

  // Sync sliders when value changes externally
  useEffect(() => {
    const d = parseValue(value);
    if (d) { setHour(d.getHours()); setMinute(d.getMinutes()); }
  }, [value]);

  function handleDaySelect(day: Date | undefined) {
    if (!day) return;
    const updated = new Date(day);
    updated.setHours(hour, minute, 0, 0);
    onChange(toLocalString(updated));
  }

  function applyTime(h: number, m: number) {
    if (selected) {
      const updated = new Date(selected);
      updated.setHours(h, m, 0, 0);
      onChange(toLocalString(updated));
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setOpen(false);
  }

  const displayValue = selected ? format(selected, 'MMM d, yyyy  HH:mm') : '';

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-left hover:border-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
      >
        <CalendarDays className="w-4 h-4 text-slate-500 shrink-0" />
        <span className={`flex-1 ${displayValue ? 'text-white' : 'text-slate-500'}`}>
          {displayValue || placeholder}
        </span>
        {displayValue && (
          <span onClick={handleClear} className="text-slate-500 hover:text-white transition-colors cursor-pointer p-0.5">
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className={`dtp-popover absolute z-[200] left-0 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/70 p-4 w-72 ${openUpward ? 'bottom-full mb-2' : 'mt-2'}`}>

          {/* Calendar */}
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            defaultMonth={selected ?? new Date()}
            disabled={minDate ? { before: minDate } : undefined}
            showOutsideDays
          />

          {/* Divider */}
          <div className="border-t border-slate-800 mt-1 pt-3 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-400 font-medium">Time</span>
              <span className="ml-auto text-sm font-bold text-cyan-300 tabular-nums">
                {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}
              </span>
            </div>

            {/* Hour slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Hour</span><span>{String(hour).padStart(2, '0')}h</span>
              </div>
              <input type="range" min={0} max={23} value={hour}
                onChange={e => { const h = Number(e.target.value); setHour(h); applyTime(h, minute); }}
                className="dtp-slider w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-600 px-0.5">
                {['00','06','12','18','23'].map(t => <span key={t}>{t}</span>)}
              </div>
            </div>

            {/* Minute slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Minute</span><span>:{String(minute).padStart(2, '0')}</span>
              </div>
              <input type="range" min={0} max={55} step={5} value={minute}
                onChange={e => { const m = Number(e.target.value); setMinute(m); applyTime(hour, m); }}
                className="dtp-slider w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-600 px-0.5">
                {[':00',':15',':30',':45',':55'].map(t => <span key={t}>{t}</span>)}
              </div>
            </div>
          </div>

          {/* Confirm */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 w-full py-2 rounded-xl bg-cyan-500 text-slate-950 text-sm font-bold hover:bg-cyan-400 transition-colors"
          >
            {selected ? `✓  ${format(selected, 'MMM d, yyyy · HH:mm')}` : 'Select a date first'}
          </button>
        </div>
      )}
    </div>
  );
}

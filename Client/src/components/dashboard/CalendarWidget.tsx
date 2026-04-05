import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  to?: string;
  badge?: "Start" | "Check-In";
  status?: string;
};

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default function CalendarWidget({
  events = [],
}: {
  events?: CalendarEvent[];
}) {
  const [date, setDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    toDateKey(new Date()),
  );
  const today = useMemo(() => new Date(), []);

  const year = date.getFullYear();
  const month = date.getMonth();
  const monthName = date.toLocaleString("default", { month: "long" });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    events.forEach((event) => {
      const rawDate = new Date(event.date);
      if (Number.isNaN(rawDate.getTime())) return;

      const key = toDateKey(rawDate);
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);
    });

    map.forEach((items) => {
      items.sort((a, b) => a.title.localeCompare(b.title));
    });

    return map;
  }, [events]);

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: {
    day: number;
    current: boolean;
    isToday: boolean;
    dateKey: string;
    hasEvents: boolean;
  }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrev - i);
    const dateKey = toDateKey(prevDate);
    cells.push({
      day: daysInPrev - i,
      current: false,
      isToday: false,
      dateKey,
      hasEvents: eventsByDate.has(dateKey),
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(year, month, d);
    const dateKey = toDateKey(currentDate);
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    cells.push({
      day: d,
      current: true,
      isToday,
      dateKey,
      hasEvents: eventsByDate.has(dateKey),
    });
  }

  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateKey = toDateKey(nextDate);
      cells.push({
        day: d,
        current: false,
        isToday: false,
        dateKey,
        hasEvents: eventsByDate.has(dateKey),
      });
    }
  }

  useEffect(() => {
    const currentSelection = parseDateKey(selectedDateKey);
    const isCurrentMonthSelected =
      currentSelection &&
      currentSelection.getFullYear() === year &&
      currentSelection.getMonth() === month;

    if (isCurrentMonthSelected) return;

    let firstEventInMonthKey: string | undefined;
    for (let day = 1; day <= daysInMonth; day++) {
      const key = toDateKey(new Date(year, month, day));
      if (eventsByDate.has(key)) {
        firstEventInMonthKey = key;
        break;
      }
    }

    const fallbackKey =
      firstEventInMonthKey ?? toDateKey(new Date(year, month, 1));

    if (fallbackKey !== selectedDateKey) {
      setSelectedDateKey(fallbackKey);
    }
  }, [daysInMonth, eventsByDate, month, selectedDateKey, year]);

  const selectedDate = parseDateKey(selectedDateKey);
  const selectedEvents = selectedDateKey
    ? (eventsByDate.get(selectedDateKey) ?? [])
    : [];

  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Selected date";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">
          {monthName}, {year}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setDate(new Date(year, month - 1, 1))}
            className="p-1 rounded hover:bg-white/10 text-slate-400"
            type="button"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDate(new Date(year, month + 1, 1))}
            className="p-1 rounded hover:bg-white/10 text-slate-400"
            type="button"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs">
        {DAYS.map((d) => (
          <div key={d} className="py-1 text-slate-500 font-medium">
            {d}
          </div>
        ))}

        {cells.map((c) => {
          const isSelected = c.dateKey === selectedDateKey;

          return (
            <button
              key={c.dateKey}
              type="button"
              onClick={() => {
                setSelectedDateKey(c.dateKey);
                if (!c.current) {
                  const clickedDate = parseDateKey(c.dateKey);
                  if (clickedDate) {
                    setDate(
                      new Date(
                        clickedDate.getFullYear(),
                        clickedDate.getMonth(),
                        1,
                      ),
                    );
                  }
                }
              }}
              className={`py-1.5 rounded-md text-xs relative transition-colors ${
                isSelected
                  ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                  : c.isToday
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : c.current
                      ? "text-slate-200 hover:bg-white/8"
                      : "text-slate-600"
              }`}
            >
              {c.day}
              {c.hasEvents && (
                <span
                  className={`absolute left-1/2 -translate-x-1/2 bottom-1 h-1 w-1 rounded-full ${
                    isSelected || c.isToday ? "bg-cyan-200" : "bg-cyan-400"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800">
        <p className="text-[11px] text-slate-400 mb-2">{selectedDateLabel}</p>
        {selectedEvents.length > 0 ? (
          <div className="space-y-2 max-h-36 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(56,189,248,0.5)_rgba(15,23,42,0.45)] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-800/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-cyan-500/50 hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/60">
            {selectedEvents.slice(0, 4).map((event) => {
              const badgeColor =
                event.badge === "Check-In"
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-cyan-500/20 text-cyan-300";

              return (
                <div
                  key={event.id}
                  className="rounded-md border border-slate-800 bg-slate-800/50 px-2.5 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-200 truncate">
                      {event.title}
                    </p>
                    {event.badge ? (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${badgeColor}`}
                      >
                        {event.badge}
                      </span>
                    ) : null}
                  </div>
                  {event.to ? (
                    <Link
                      to={event.to}
                      className="text-[10px] text-cyan-300 hover:text-cyan-200"
                    >
                      Open tournament
                    </Link>
                  ) : null}
                </div>
              );
            })}
            {selectedEvents.length > 4 && (
              <p className="text-[10px] text-slate-500">
                +{selectedEvents.length - 4} more
              </p>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            No tournament events on this day.
          </p>
        )}
      </div>
    </div>
  );
}

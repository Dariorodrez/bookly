// client/src/components/Calendar.jsx
import { useMemo, useState } from "react";
import { Icon } from "./Icons.jsx";
import {
  addDaysISO,
  combineDateTime,
  dayOfWeekISO,
  formatDateLong,
  monthLabel,
  monthMatrix,
  todayISO,
} from "../lib/datetime.js";

const DOW = ["L", "M", "X", "J", "V", "S", "D"];

export default function Calendar({ value, onChange, closedDays = [], minDate = todayISO() }) {
  const today = todayISO();
  const [view, setView] = useState(() => {
    const base = value || today;
    const [y, m] = base.split("-").map(Number);
    return { year: y, month: m };
  });

  const closed = useMemo(() => new Set(closedDays.map(Number)), [closedDays]);
  const weeks = useMemo(() => monthMatrix(view.year, view.month), [view]);
  const todayDate = combineDateTime(today, "12:00");

  function shift(delta) {
    const d = new Date(Date.UTC(view.year, view.month - 1 + delta, 1));
    setView({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 });
  }

  const canGoBack = (() => {
    const [ty, tm] = today.split("-").map(Number);
    return view.year > ty || (view.year === ty && view.month > tm);
  })();

  return (
    <div className="calendar">
      <div className="calendar__head">
        <div className="calendar__month">{monthLabel(view.year, view.month)}</div>
        <div className="calendar__nav">
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={() => shift(-1)}
            disabled={!canGoBack}
            aria-label="Mes anterior"
          >
            <Icon name="chevronLeft" size={17} />
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            onClick={() => shift(1)}
            aria-label="Mes siguiente"
          >
            <Icon name="chevronRight" size={17} />
          </button>
        </div>
      </div>

      <div className="calendar__dow" aria-hidden="true">
        {DOW.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendar__grid" role="grid" aria-label="Elige un día">
        {weeks.flat().map((date, i) => {
          if (!date) return <span key={`empty-${i}`} className="cal-day is-empty" aria-hidden="true" />;
          const isPast = date < minDate;
          const isClosed = closed.has(dayOfWeekISO(date));
          const disabled = isPast || isClosed;
          const isSelected = date === value;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              className={`cal-day ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""} ${
                isClosed ? "is-closed" : ""
              }`}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`${formatDateLong(combineDateTime(date, "12:00"))}${isClosed ? " (cerrado)" : ""}`}
              onClick={() => onChange(date)}
              title={isClosed ? "Cerrado" : undefined}
            >
              {Number(date.slice(8))}
              {isToday && !isSelected && <span className="cal-day__dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="calendar__legend">
        <span>
          <i className="legend-dot" /> Disponible
        </span>
        <span>
          <i className="legend-dot legend-dot--today" /> Hoy
        </span>
        <span className="muted">Los días tachados están cerrados.</span>
      </div>
    </div>
  );
}

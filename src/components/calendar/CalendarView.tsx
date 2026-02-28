"use client";

import { useState, useMemo, useCallback } from "react";
import { startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isFuture, isToday } from "date-fns";
import LogModal from "@/components/calendar/LogModal";
import type { DayLog } from "@/lib/types";

interface CalendarViewProps {
    logs: DayLog[];
    year: number;
    onSaveLog: (date: string, status: "clean" | "relapse" | "partial", note: string, cost: number) => Promise<void>;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarView({ logs, year, onSaveLog }: CalendarViewProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const logMap = useMemo(() => {
        const map = new Map<string, DayLog>();
        for (const log of logs) map.set(log.date, log);
        return map;
    }, [logs]);

    const months = useMemo(() => {
        const ys = startOfYear(new Date(year, 0, 1));
        return eachMonthOfInterval({ start: ys, end: endOfYear(ys) });
    }, [year]);

    const handleDayClick = useCallback((dateStr: string) => {
        const d = new Date(dateStr + "T00:00:00");
        if (isFuture(d) && !isToday(d)) return;
        setSelectedDate(dateStr);
    }, []);

    async function handleSave(status: "clean" | "relapse" | "partial", note: string, cost: number) {
        if (!selectedDate) return;
        await onSaveLog(selectedDate, status, note, cost);
        setSelectedDate(null);
    }

    return (
        <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {months.map((month) => {
                    const ms = startOfMonth(month);
                    const days = eachDayOfInterval({ start: ms, end: endOfMonth(month) });
                    const offset = getDay(ms);

                    return (
                        <div key={format(month, "MMM")} className="card p-3">
                            <h4 className="text-xs font-medium text-neutral-500 mb-2 text-center">{format(month, "MMM")}</h4>
                            <div className="grid grid-cols-7 gap-0.5 mb-1">
                                {WEEKDAYS.map((d, i) => (
                                    <div key={i} className="text-center text-[0.5rem] text-neutral-300 font-medium">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5">
                                {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
                                {days.map((day) => {
                                    const ds = format(day, "yyyy-MM-dd");
                                    const log = logMap.get(ds);
                                    const future = isFuture(day) && !isToday(day);
                                    let cls = "calendar-day calendar-day-empty";
                                    if (future) cls = "calendar-day calendar-day-disabled";
                                    else if (log) cls = `calendar-day calendar-day-${log.status}`;
                                    return (
                                        <button key={ds} onClick={() => handleDayClick(ds)} disabled={future} className={cls} title={ds}>
                                            {day.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-neutral-200 border border-neutral-300" /><span className="text-xs text-neutral-400">Clean</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-neutral-600 border border-neutral-500" /><span className="text-xs text-neutral-400">Relapse</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-neutral-300 border border-neutral-400" /><span className="text-xs text-neutral-400">Partial</span></div>
            </div>

            {selectedDate && (
                <LogModal date={selectedDate} existingLog={logMap.get(selectedDate) ?? null} onSave={handleSave} onClose={() => setSelectedDate(null)} />
            )}
        </div>
    );
}

"use client";

import { useState, useMemo, useCallback } from "react";
import {
    startOfYear,
    endOfYear,
    eachMonthOfInterval,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    getDay,
    isFuture,
    isToday,
} from "date-fns";
import LogModal from "@/components/calendar/LogModal";
import type { DayLog } from "@/lib/types";

interface CalendarViewProps {
    logs: DayLog[];
    year: number;
    onSaveLog: (date: string, status: "clean" | "relapse" | "partial", note: string) => Promise<void>;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ logs, year, onSaveLog }: CalendarViewProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const logMap = useMemo(() => {
        const map = new Map<string, DayLog>();
        for (const log of logs) {
            map.set(log.date, log);
        }
        return map;
    }, [logs]);

    const months = useMemo(() => {
        const yearStart = startOfYear(new Date(year, 0, 1));
        const yearEnd = endOfYear(yearStart);
        return eachMonthOfInterval({ start: yearStart, end: yearEnd });
    }, [year]);

    const handleDayClick = useCallback((dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        if (isFuture(date) && !isToday(date)) return;
        setSelectedDate(dateStr);
    }, []);

    async function handleSave(status: "clean" | "relapse" | "partial", note: string) {
        if (!selectedDate) return;
        await onSaveLog(selectedDate, status, note);
        setSelectedDate(null);
    }

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {months.map((month) => {
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);
                    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
                    const firstDayOffset = getDay(monthStart);
                    const monthLabel = format(month, "MMM");

                    return (
                        <div key={monthLabel} className="glass-card p-3 hover:translate-y-0">
                            <h4 className="text-xs font-semibold text-gray-300 mb-2 text-center">
                                {monthLabel}
                            </h4>

                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-0.5 mb-1">
                                {WEEKDAYS.map((d) => (
                                    <div key={d} className="text-center text-[0.5rem] text-gray-500 font-medium">
                                        {d[0]}
                                    </div>
                                ))}
                            </div>

                            {/* Day grid */}
                            <div className="grid grid-cols-7 gap-0.5">
                                {/* Empty cells for offset */}
                                {Array.from({ length: firstDayOffset }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}

                                {days.map((day) => {
                                    const dateStr = format(day, "yyyy-MM-dd");
                                    const log = logMap.get(dateStr);
                                    const future = isFuture(day) && !isToday(day);

                                    let dayClass = "calendar-day calendar-day-empty";
                                    if (future) {
                                        dayClass = "calendar-day calendar-day-disabled";
                                    } else if (log) {
                                        dayClass = `calendar-day calendar-day-${log.status}`;
                                    }

                                    return (
                                        <button
                                            key={dateStr}
                                            onClick={() => handleDayClick(dateStr)}
                                            disabled={future}
                                            className={dayClass}
                                            title={`${dateStr}${log ? ` — ${log.status}` : ""}`}
                                        >
                                            {day.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-green-500/60 border border-green-500/80" />
                    <span className="text-xs text-gray-400">Clean</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-500/80" />
                    <span className="text-xs text-gray-400">Relapse</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-yellow-500/60 border border-yellow-500/80" />
                    <span className="text-xs text-gray-400">Partial</span>
                </div>
            </div>

            {/* Modal */}
            {selectedDate && (
                <LogModal
                    date={selectedDate}
                    existingLog={logMap.get(selectedDate) ?? null}
                    onSave={handleSave}
                    onClose={() => setSelectedDate(null)}
                />
            )}
        </div>
    );
}

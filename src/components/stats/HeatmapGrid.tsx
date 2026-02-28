"use client";

import { useMemo } from "react";
import { format, parseISO, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import type { Log } from "@/lib/types";

interface HeatmapGridProps {
    logs: Log[];
}

export default function HeatmapGrid({ logs }: HeatmapGridProps) {
    const heatmapData = useMemo(() => {
        if (logs.length === 0) return [];

        const logMap = new Map<string, Log>();
        for (const log of logs) {
            logMap.set(log.date, log);
        }

        const sortedDates = logs.map((l) => l.date).sort();
        const firstDate = parseISO(sortedDates[0]);
        const lastDate = parseISO(sortedDates[sortedDates.length - 1]);

        const months = eachMonthOfInterval({ start: firstDate, end: lastDate });

        return months.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

            const dayCells = days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const log = logMap.get(dateStr);
                return {
                    date: dateStr,
                    status: log?.status ?? null,
                };
            });

            return {
                label: format(month, "MMM yyyy"),
                days: dayCells,
            };
        });
    }, [logs]);

    if (heatmapData.length === 0) return null;

    function getColor(status: string | null): string {
        switch (status) {
            case "clean":
                return "bg-green-500/50";
            case "relapse":
                return "bg-red-500/50";
            case "partial":
                return "bg-yellow-500/50";
            default:
                return "bg-white/3";
        }
    }

    return (
        <div className="glass-card p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🌡️</span> Monthly Heatmap
            </h3>
            <div className="space-y-3 overflow-x-auto">
                {heatmapData.map((month) => (
                    <div key={month.label} className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-16 shrink-0 text-right">
                            {month.label}
                        </span>
                        <div className="flex gap-0.5">
                            {month.days.map((day) => (
                                <div
                                    key={day.date}
                                    className={`w-3 h-3 rounded-sm ${getColor(day.status)} transition-all hover:scale-150 hover:z-10`}
                                    title={`${day.date}${day.status ? ` — ${day.status}` : ""}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                <span className="text-xs text-gray-500">Legend:</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-green-500/50" />
                    <span className="text-xs text-gray-400">Clean</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-red-500/50" />
                    <span className="text-xs text-gray-400">Relapse</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-yellow-500/50" />
                    <span className="text-xs text-gray-400">Partial</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-white/5" />
                    <span className="text-xs text-gray-400">No Data</span>
                </div>
            </div>
        </div>
    );
}

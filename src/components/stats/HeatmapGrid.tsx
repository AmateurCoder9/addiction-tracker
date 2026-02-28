"use client";

import { useMemo } from "react";
import { format, parseISO, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import type { Log } from "@/lib/types";

interface HeatmapGridProps { logs: Log[]; }

export default function HeatmapGrid({ logs }: HeatmapGridProps) {
    const data = useMemo(() => {
        if (logs.length === 0) return [];
        const logMap = new Map<string, Log>();
        for (const log of logs) logMap.set(log.date, log);

        const sorted = logs.map((l) => l.date).sort();
        const months = eachMonthOfInterval({ start: parseISO(sorted[0]), end: parseISO(sorted[sorted.length - 1]) });

        return months.map((month) => ({
            label: format(month, "MMM yy"),
            days: eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((day) => {
                const ds = format(day, "yyyy-MM-dd");
                return { date: ds, status: logMap.get(ds)?.status ?? null };
            }),
        }));
    }, [logs]);

    if (data.length === 0) return null;

    function getBg(s: string | null): string {
        if (s === "clean") return "bg-neutral-300";
        if (s === "relapse") return "bg-neutral-700";
        if (s === "partial") return "bg-neutral-400";
        return "bg-neutral-100";
    }

    return (
        <div className="card p-5">
            <h3 className="text-sm font-medium text-neutral-900 mb-4">Heatmap</h3>
            <div className="space-y-2 overflow-x-auto">
                {data.map((month) => (
                    <div key={month.label} className="flex items-center gap-2">
                        <span className="text-[0.65rem] text-neutral-400 w-12 shrink-0 text-right font-mono">{month.label}</span>
                        <div className="flex gap-px">
                            {month.days.map((d) => (
                                <div key={d.date} className={`w-2.5 h-2.5 rounded-sm ${getBg(d.status)} hover:ring-1 hover:ring-neutral-400 transition-all`} title={`${d.date}${d.status ? ` — ${d.status}` : ""}`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

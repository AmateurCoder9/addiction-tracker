"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateStreaks, isMilestoneStreak } from "@/lib/streaks";
import { fireConfetti } from "@/lib/confetti";
import type { Addiction, Log, DayLog } from "@/lib/types";
import CalendarView from "@/components/calendar/CalendarView";
import StreakDisplay from "@/components/dashboard/StreakDisplay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AddictionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [addiction, setAddiction] = useState<Addiction | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [refreshKey, setRefreshKey] = useState(0);
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        let cancelled = false;
        const supabase = supabaseRef.current;

        async function load() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user || cancelled) return;

            const { data: addictionData } = await supabase
                .from("addictions")
                .select("*")
                .eq("id", id)
                .eq("user_id", user.id)
                .single();

            if (cancelled) return;

            if (!addictionData) {
                router.push("/dashboard");
                return;
            }

            setAddiction(addictionData);

            const { data: logsData } = await supabase
                .from("logs")
                .select("*")
                .eq("addiction_id", id)
                .eq("user_id", user.id)
                .order("date", { ascending: true });

            if (cancelled) return;

            if (logsData) {
                setLogs(logsData);
            }

            setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, [id, router, refreshKey]);

    async function handleSaveLog(
        date: string,
        status: "clean" | "relapse" | "partial",
        note: string,
        cost: number
    ) {
        const supabase = supabaseRef.current;
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const existingLog = logs.find((l) => l.date === date);

        if (existingLog) {
            await supabase
                .from("logs")
                .update({ status, note: note || null, cost })
                .eq("id", existingLog.id);
        } else {
            await supabase.from("logs").insert({
                user_id: user.id,
                addiction_id: id,
                date,
                status,
                note: note || null,
                cost,
            });
        }

        setRefreshKey((k) => k + 1);

        const updatedLogs = logs.map((l) =>
            l.date === date ? { ...l, status, note, cost } : l
        );
        if (!existingLog) {
            updatedLogs.push({
                id: "temp",
                user_id: user.id,
                addiction_id: id,
                date,
                status,
                note,
                cost,
                created_at: new Date().toISOString(),
            });
        }
        const streakData = calculateStreaks(updatedLogs);
        if (isMilestoneStreak(streakData.currentStreak)) {
            fireConfetti();
        }
    }

    if (loading) {
        return <LoadingSpinner message="Loading tracker..." />;
    }

    if (!addiction) {
        return null;
    }

    const streakData = calculateStreaks(logs);

    const dayLogs: DayLog[] = logs.map((l) => ({
        date: l.date,
        status: l.status,
        note: l.note,
        cost: Number(l.cost) || 0,
    }));

    const currentYear = new Date().getFullYear();

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    aria-label="Back to dashboard"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{addiction.name}</h1>
                    <p className="text-sm text-gray-500">
                        Tracking since {new Date(addiction.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Streak Stats */}
            <StreakDisplay streakData={streakData} addictionName={addiction.name} />

            {/* Monthly Summary */}
            {streakData.monthlySummary.length > 0 && (
                <div className="glass-card p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span>📅</span> Monthly Summary
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 text-gray-500 font-medium">Month</th>
                                    <th className="text-center py-2 text-emerald-600 font-medium">Clean</th>
                                    <th className="text-center py-2 text-red-500 font-medium">Relapse</th>
                                    <th className="text-center py-2 text-amber-500 font-medium">Partial</th>
                                    <th className="text-center py-2 text-gray-500 font-medium">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {streakData.monthlySummary.map((m) => (
                                    <tr key={`${m.month}-${m.year}`} className="border-b border-gray-50 last:border-0">
                                        <td className="py-2 text-gray-700">{m.month} {m.year}</td>
                                        <td className="text-center py-2 text-emerald-600">{m.clean}</td>
                                        <td className="text-center py-2 text-red-500">{m.relapse}</td>
                                        <td className="text-center py-2 text-amber-500">{m.partial}</td>
                                        <td className="text-center py-2 text-gray-500">₹{m.cost.toFixed(0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Calendar */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <span>🗓️</span> Calendar — {year}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setYear(year - 1)}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                            aria-label="Previous year"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm text-gray-600 font-medium min-w-[3rem] text-center">{year}</span>
                        <button
                            onClick={() => setYear(year + 1)}
                            disabled={year >= currentYear}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Next year"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <CalendarView
                    logs={dayLogs.filter((l) => l.date.startsWith(String(year)))}
                    year={year}
                    onSaveLog={handleSaveLog}
                />
            </div>
        </div>
    );
}

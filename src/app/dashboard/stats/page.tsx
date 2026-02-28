"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateStreaks } from "@/lib/streaks";
import type { Addiction, Log } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatsCharts from "@/components/stats/StatsCharts";
import HeatmapGrid from "@/components/stats/HeatmapGrid";

export default function StatsPage() {
    const [addictions, setAddictions] = useState<Addiction[]>([]);
    const [logsMap, setLogsMap] = useState<Record<string, Log[]>>({});
    const [selectedAddiction, setSelectedAddiction] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        let cancelled = false;
        const supabase = supabaseRef.current;

        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || cancelled) return;

            const { data: addictionsData } = await supabase
                .from("addictions").select("*").eq("user_id", user.id).order("created_at", { ascending: true });

            if (cancelled) return;

            if (addictionsData) {
                setAddictions(addictionsData);
                if (addictionsData.length > 0) {
                    setSelectedAddiction((prev) => prev ?? addictionsData[0].id);
                }

                const { data: logsData } = await supabase
                    .from("logs").select("*").eq("user_id", user.id).order("date", { ascending: true });

                if (cancelled) return;

                if (logsData) {
                    const grouped: Record<string, Log[]> = {};
                    for (const log of logsData) {
                        if (!grouped[log.addiction_id]) grouped[log.addiction_id] = [];
                        grouped[log.addiction_id].push(log);
                    }
                    setLogsMap(grouped);
                }
            }
            setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, []);

    const currentLogs = useMemo(() => (selectedAddiction ? logsMap[selectedAddiction] || [] : []), [logsMap, selectedAddiction]);
    const streakData = useMemo(() => calculateStreaks(currentLogs), [currentLogs]);
    const currentAddictionName = useMemo(() => addictions.find((a) => a.id === selectedAddiction)?.name ?? "", [addictions, selectedAddiction]);

    if (loading) return <LoadingSpinner message="Loading statistics..." />;

    if (addictions.length === 0) {
        return (
            <div className="text-center py-20 animate-fade-in">
                <div className="text-5xl mb-4">📊</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">No Data Yet</h2>
                <p className="text-gray-500 text-sm">Start tracking an addiction to see your statistics here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Statistics</h1>
                <p className="text-gray-500 mt-1 text-sm">Visualize your progress and insights.</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {addictions.map((a) => (
                    <button key={a.id} onClick={() => setSelectedAddiction(a.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${selectedAddiction === a.id
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                            }`}
                    >{a.name}</button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 stagger-children">
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl mb-1">🔥</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{streakData.currentStreak}</div>
                    <div className="text-xs text-gray-400 mt-1">Current Streak</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl mb-1">🏆</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">{streakData.longestStreak}</div>
                    <div className="text-xs text-gray-400 mt-1">Best Streak</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{streakData.cleanPercentage}%</div>
                    <div className="text-xs text-gray-400 mt-1">Clean Rate</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl mb-1">📝</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">{streakData.totalLogs}</div>
                    <div className="text-xs text-gray-400 mt-1">Total Entries</div>
                </div>
                <div className="glass-card p-4 text-center">
                    <div className="text-2xl mb-1">💸</div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">₹{streakData.totalCost.toFixed(0)}</div>
                    <div className="text-xs text-gray-400 mt-1">Money Spent</div>
                </div>
            </div>

            {streakData.monthlySummary.length > 0 && (
                <StatsCharts monthlySummary={streakData.monthlySummary} addictionName={currentAddictionName} />
            )}

            {currentLogs.length > 0 && <HeatmapGrid logs={currentLogs} />}
        </div>
    );
}

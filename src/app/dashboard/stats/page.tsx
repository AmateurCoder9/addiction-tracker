"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { calculateStreaks } from "@/lib/streaks";
import type { Addiction, Log } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StatsCharts from "@/components/stats/StatsCharts";
import HeatmapGrid from "@/components/stats/HeatmapGrid";

export default function StatsPage() {
    const router = useRouter();
    const [addictions, setAddictions] = useState<Addiction[]>([]);
    const [logsMap, setLogsMap] = useState<Record<string, Log[]>>({});
    const [selectedAddiction, setSelectedAddiction] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) setUserId(user.uid);
            else router.push("/login");
        });
        return () => unsub();
    }, [router]);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        async function load() {
            try {
                const addQ = query(collection(db, "addictions"), where("user_id", "==", userId));
                const addSnap = await getDocs(addQ);
                if (cancelled) return;
                const addData = addSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Addiction)).sort((a, b) => a.created_at.localeCompare(b.created_at));
                setAddictions(addData);
                if (addData.length > 0) setSelectedAddiction((prev) => prev ?? addData[0].id);

                const logQ = query(collection(db, "logs"), where("user_id", "==", userId));
                const logSnap = await getDocs(logQ);
                if (cancelled) return;
                const grouped: Record<string, Log[]> = {};
                for (const d of logSnap.docs) {
                    const log = { id: d.id, ...d.data() } as Log;
                    if (!grouped[log.addiction_id]) grouped[log.addiction_id] = [];
                    grouped[log.addiction_id].push(log);
                }
                for (const key of Object.keys(grouped)) grouped[key].sort((a, b) => a.date.localeCompare(b.date));
                setLogsMap(grouped);
            } catch (e) { console.error(e); }
            setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, [userId]);

    const currentLogs = useMemo(() => (selectedAddiction ? logsMap[selectedAddiction] || [] : []), [logsMap, selectedAddiction]);
    const streakData = useMemo(() => calculateStreaks(currentLogs), [currentLogs]);
    const currentAddictionName = useMemo(() => addictions.find((a) => a.id === selectedAddiction)?.name ?? "", [addictions, selectedAddiction]);

    if (loading) return <LoadingSpinner message="Loading statistics..." />;

    if (addictions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <h2 className="text-lg font-semibold text-neutral-300 mb-2">No Data Yet</h2>
                    <p className="text-neutral-500 text-sm">Start tracking to see statistics.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-6">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-semibold text-white">Statistics</h1>
                    <p className="text-neutral-500 mt-1 text-sm">Visualize your progress.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {addictions.map((a) => (
                        <button key={a.id} onClick={() => setSelectedAddiction(a.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedAddiction === a.id
                                ? "bg-white text-black border-white"
                                : "bg-neutral-950 text-neutral-500 border-neutral-800 hover:border-neutral-700"
                                }`}
                        >{a.name}</button>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
                        <div className="text-2xl font-light text-white">{streakData.currentStreak}</div>
                        <div className="text-[0.65rem] text-neutral-500 mt-1">Current Streak</div>
                    </div>
                    <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
                        <div className="text-2xl font-light text-white">{streakData.longestStreak}</div>
                        <div className="text-[0.65rem] text-neutral-500 mt-1">Best Streak</div>
                    </div>
                    <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
                        <div className="text-2xl font-light text-white">{streakData.cleanPercentage}%</div>
                        <div className="text-[0.65rem] text-neutral-500 mt-1">Clean Rate</div>
                    </div>
                    <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
                        <div className="text-2xl font-light text-white">{streakData.totalLogs}</div>
                        <div className="text-[0.65rem] text-neutral-500 mt-1">Total Entries</div>
                    </div>
                    <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-center">
                        <div className="text-2xl font-light text-white">₹{streakData.totalCost.toFixed(0)}</div>
                        <div className="text-[0.65rem] text-neutral-500 mt-1">Money Spent</div>
                    </div>
                </div>

                {streakData.monthlySummary.length > 0 && (
                    <StatsCharts monthlySummary={streakData.monthlySummary} addictionName={currentAddictionName} />
                )}

                {currentLogs.length > 0 && <HeatmapGrid logs={currentLogs} />}
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateStreaks, isMilestoneStreak } from "@/lib/streaks";
import { fireConfetti } from "@/lib/confetti";
import type { Addiction, Log, DayLog } from "@/lib/types";
import CalendarView from "@/components/calendar/CalendarView";
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || cancelled) return;
            const { data: a } = await supabase.from("addictions").select("*").eq("id", id).eq("user_id", user.id).single();
            if (cancelled) return;
            if (!a) { router.push("/dashboard"); return; }
            setAddiction(a);
            const { data: l } = await supabase.from("logs").select("*").eq("addiction_id", id).eq("user_id", user.id).order("date", { ascending: true });
            if (cancelled) return;
            if (l) setLogs(l);
            setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, [id, router, refreshKey]);

    async function handleSaveLog(date: string, status: "clean" | "relapse" | "partial", note: string, cost: number) {
        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const existing = logs.find((l) => l.date === date);
        if (existing) {
            await supabase.from("logs").update({ status, note: note || null, cost }).eq("id", existing.id);
        } else {
            await supabase.from("logs").insert({ user_id: user.id, addiction_id: id, date, status, note: note || null, cost });
        }
        setRefreshKey((k) => k + 1);
        const updated = logs.map((l) => l.date === date ? { ...l, status, note, cost } : l);
        if (!existing) updated.push({ id: "temp", user_id: user.id, addiction_id: id, date, status, note, cost, created_at: new Date().toISOString() });
        if (isMilestoneStreak(calculateStreaks(updated).currentStreak)) fireConfetti();
    }

    if (loading) return <LoadingSpinner message="Loading..." />;
    if (!addiction) return null;

    const streakData = calculateStreaks(logs);
    const dayLogs: DayLog[] = logs.map((l) => ({ date: l.date, status: l.status, note: l.note, cost: Number(l.cost) || 0 }));
    const currentYear = new Date().getFullYear();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={() => router.push("/dashboard")} className="p-1.5 rounded text-neutral-400 hover:text-neutral-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                    <h1 className="text-lg font-semibold text-neutral-900">{addiction.name}</h1>
                    <p className="text-xs text-neutral-400">Since {new Date(addiction.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="card p-5">
                <div className="grid grid-cols-4 gap-4 text-center">
                    <div><div className="text-2xl font-light text-neutral-900">{streakData.currentStreak}</div><div className="text-[0.65rem] text-neutral-400">Current</div></div>
                    <div><div className="text-2xl font-light text-neutral-900">{streakData.longestStreak}</div><div className="text-[0.65rem] text-neutral-400">Best</div></div>
                    <div><div className="text-2xl font-light text-neutral-900">{streakData.cleanPercentage}%</div><div className="text-[0.65rem] text-neutral-400">Clean</div></div>
                    <div><div className="text-2xl font-light text-neutral-900">₹{streakData.totalCost.toFixed(0)}</div><div className="text-[0.65rem] text-neutral-400">Spent</div></div>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-neutral-900">{year}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setYear(year - 1)} className="p-1 rounded text-neutral-400 hover:text-neutral-600">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button onClick={() => setYear(year + 1)} disabled={year >= currentYear} className="p-1 rounded text-neutral-400 hover:text-neutral-600 disabled:opacity-20">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                </div>
                <CalendarView logs={dayLogs.filter((l) => l.date.startsWith(String(year)))} year={year} onSaveLog={handleSaveLog} />
            </div>
        </div>
    );
}

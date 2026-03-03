"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
                const addictionDoc = await getDoc(doc(db, "addictions", id));
                if (cancelled) return;
                if (!addictionDoc.exists() || addictionDoc.data().user_id !== userId) { router.push("/dashboard"); return; }
                setAddiction({ id: addictionDoc.id, ...addictionDoc.data() } as Addiction);

                const logQ = query(collection(db, "logs"), where("addiction_id", "==", id), where("user_id", "==", userId));
                const logSnap = await getDocs(logQ);
                if (cancelled) return;
                setLogs(logSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Log)).sort((a, b) => a.date.localeCompare(b.date)));
            } catch (e) { console.error(e); }
            setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, [id, userId, router, refreshKey]);

    async function handleSaveLog(date: string, status: "clean" | "relapse" | "partial", note: string, cost: number) {
        if (!userId) return;
        try {
            const existing = logs.find((l) => l.date === date);
            if (existing) {
                await updateDoc(doc(db, "logs", existing.id), { status, note: note || null, cost: cost || 0 });
            } else {
                await addDoc(collection(db, "logs"), { user_id: userId, addiction_id: id, date, status, note: note || null, cost: cost || 0, created_at: new Date().toISOString() });
            }
            setRefreshKey((k) => k + 1);
            const updated = logs.map((l) => l.date === date ? { ...l, status, note, cost } : l);
            if (!existing) updated.push({ id: "temp", user_id: userId, addiction_id: id, date, status, note, cost, created_at: new Date().toISOString() });
            if (isMilestoneStreak(calculateStreaks(updated).currentStreak)) fireConfetti();
        } catch (e) { console.error(e); }
    }

    if (loading) return <LoadingSpinner message="Loading..." />;
    if (!addiction) return null;

    const streakData = calculateStreaks(logs);
    const dayLogs: DayLog[] = logs.map((l) => ({ date: l.date, status: l.status, note: l.note, cost: Number(l.cost) || 0 }));
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen text-white p-6">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push("/dashboard")} className="p-1.5 rounded text-neutral-500 hover:text-neutral-300 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-white">{addiction.name}</h1>
                        <p className="text-xs text-neutral-500">Since {new Date(addiction.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="p-5 rounded-lg bg-neutral-950 border border-neutral-800">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div><div className="text-2xl font-light text-white">{streakData.currentStreak}</div><div className="text-[0.65rem] text-neutral-500">Current</div></div>
                        <div><div className="text-2xl font-light text-white">{streakData.longestStreak}</div><div className="text-[0.65rem] text-neutral-500">Best</div></div>
                        <div><div className="text-2xl font-light text-white">{streakData.cleanPercentage}%</div><div className="text-[0.65rem] text-neutral-500">Clean</div></div>
                        <div><div className="text-2xl font-light text-white">₹{streakData.totalCost.toFixed(0)}</div><div className="text-[0.65rem] text-neutral-500">Spent</div></div>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-medium text-neutral-300">{year}</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setYear(year - 1)} className="p-1 rounded text-neutral-500 hover:text-neutral-300">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button onClick={() => setYear(year + 1)} disabled={year >= currentYear} className="p-1 rounded text-neutral-500 hover:text-neutral-300 disabled:opacity-20">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                    <CalendarView logs={dayLogs.filter((l) => l.date.startsWith(String(year)))} year={year} onSaveLog={handleSaveLog} />
                </div>
            </div>
        </div>
    );
}

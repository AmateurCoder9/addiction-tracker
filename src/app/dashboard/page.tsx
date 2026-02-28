"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { calculateStreaks, isMilestoneStreak, getMilestoneMessage } from "@/lib/streaks";
import { getQuoteOfTheDay } from "@/lib/quotes";
import { fireConfetti } from "@/lib/confetti";
import type { Addiction, Log, DayLog } from "@/lib/types";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { format } from "date-fns";
import CalendarView from "@/components/calendar/CalendarView";
import LogModal from "@/components/calendar/LogModal";
import ProgressRing from "@/components/ui/ProgressRing";
import AddAddictionForm from "@/components/dashboard/AddAddictionForm";
import BottomNav from "@/components/layout/BottomNav";
import StatsCharts from "@/components/stats/StatsCharts";
import HeatmapGrid from "@/components/stats/HeatmapGrid";

function AnimatedStat({ value, label }: { value: number; label: string }) {
    const { count, ref } = useAnimatedCounter(value);
    return (
        <div ref={ref} className="text-center">
            <div className="text-3xl font-light text-white">{count}</div>
            <div className="text-[0.65rem] text-neutral-500 mt-1 uppercase tracking-widest">{label}</div>
        </div>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const [addictions, setAddictions] = useState<Addiction[]>([]);
    const [logsMap, setLogsMap] = useState<Record<string, Log[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [quickLogId, setQuickLogId] = useState<string | null>(null);
    const [selectedTracker, setSelectedTracker] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState("today");
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const [loggingOut, setLoggingOut] = useState(false);
    const supabaseRef = useRef(createClient());

    const todayRef = useRef<HTMLDivElement>(null);
    const trackersRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    useScrollRevealAll();

    useEffect(() => {
        let cancelled = false;
        const supabase = supabaseRef.current;
        const timeout = setTimeout(() => {
            if (!cancelled) { setLoading(false); setError("Connection timed out. Please refresh."); }
        }, 15000);

        async function load() {
            try {
                const { data: { user }, error: userErr } = await supabase.auth.getUser();
                if (userErr) { setError("Authentication error. Please log in again."); setLoading(false); clearTimeout(timeout); return; }
                if (!user || cancelled) { setLoading(false); clearTimeout(timeout); return; }

                const { data: addictionsData, error: addErr } = await supabase.from("addictions").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
                if (cancelled) return;
                if (addErr) { setError("Could not load trackers: " + addErr.message); setLoading(false); clearTimeout(timeout); return; }

                setAddictions(addictionsData || []);
                if (addictionsData && addictionsData.length > 0) setSelectedTracker((prev) => prev ?? addictionsData[0].id);

                const { data: logsData, error: logErr } = await supabase.from("logs").select("*").eq("user_id", user.id).order("date", { ascending: true });
                if (cancelled) return;
                if (logErr) console.error("Fetch logs error:", logErr);

                if (logsData) {
                    const grouped: Record<string, Log[]> = {};
                    for (const log of logsData) {
                        if (!grouped[log.addiction_id]) grouped[log.addiction_id] = [];
                        grouped[log.addiction_id].push(log);
                    }
                    setLogsMap(grouped);

                    if (addictionsData) {
                        for (const addiction of addictionsData) {
                            const streakData = calculateStreaks(grouped[addiction.id] || []);
                            if (isMilestoneStreak(streakData.currentStreak)) {
                                setMilestoneMessage(getMilestoneMessage(streakData.currentStreak));
                                try { fireConfetti(); } catch (e) { console.error(e); }
                                break;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Dashboard load error:", err);
                setError("Connection failed. Please refresh.");
            }
            if (!cancelled) { setLoading(false); clearTimeout(timeout); }
        }

        load();
        return () => { cancelled = true; clearTimeout(timeout); };
    }, [refreshKey]);

    async function handleLogout() {
        setLoggingOut(true);
        try { await supabaseRef.current.auth.signOut(); } catch (e) { console.error(e); }
        router.push("/login");
    }

    const handleNavigate = useCallback((section: string) => {
        setActiveSection(section);
        const refs: Record<string, React.RefObject<HTMLDivElement | null>> = { today: todayRef, trackers: trackersRef, calendar: calendarRef, stats: statsRef };
        refs[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    async function handleAddAddiction(name: string) {
        try {
            const supabase = supabaseRef.current;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error: err } = await supabase.from("addictions").insert({ user_id: user.id, name });
            if (err) { setError("Failed to add: " + err.message); return; }
            setRefreshKey((k) => k + 1);
        } catch (e) { setError("Failed to add tracker."); console.error(e); }
    }

    async function handleDeleteAddiction(id: string) {
        try {
            const supabase = supabaseRef.current;
            setDeletingId(id);
            await supabase.from("logs").delete().eq("addiction_id", id);
            const { error: err } = await supabase.from("addictions").delete().eq("id", id);
            if (!err) {
                setAddictions((prev) => prev.filter((a) => a.id !== id));
                setLogsMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
                if (selectedTracker === id) setSelectedTracker(addictions[0]?.id ?? null);
            }
        } catch (e) { console.error(e); }
        setDeletingId(null);
    }

    async function handleQuickLog(status: "clean" | "relapse" | "partial", note: string, cost: number) {
        if (!quickLogId) return;
        try {
            const supabase = supabaseRef.current;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const todayStr = format(new Date(), "yyyy-MM-dd");
            const existing = (logsMap[quickLogId] || []).find((l) => l.date === todayStr);
            const logData: Record<string, unknown> = { status, note: note || null };
            if (cost > 0) logData.cost = cost;
            if (existing) { await supabase.from("logs").update(logData).eq("id", existing.id); }
            else { await supabase.from("logs").insert({ user_id: user.id, addiction_id: quickLogId, date: todayStr, ...logData }); }
        } catch (e) { console.error("Log error:", e); }
        setQuickLogId(null);
        setRefreshKey((k) => k + 1);
    }

    async function handleCalendarLog(date: string, status: "clean" | "relapse" | "partial", note: string, cost: number) {
        if (!selectedTracker) return;
        try {
            const supabase = supabaseRef.current;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const existing = (logsMap[selectedTracker] || []).find((l) => l.date === date);
            const logData: Record<string, unknown> = { status, note: note || null };
            if (cost > 0) logData.cost = cost;
            if (existing) { await supabase.from("logs").update(logData).eq("id", existing.id); }
            else { await supabase.from("logs").insert({ user_id: user.id, addiction_id: selectedTracker, date, ...logData }); }
        } catch (e) { console.error("Calendar log error:", e); }
        setRefreshKey((k) => k + 1);
    }

    const selectedLogs = useMemo(() => selectedTracker ? logsMap[selectedTracker] || [] : [], [logsMap, selectedTracker]);
    const selectedStreaks = useMemo(() => calculateStreaks(selectedLogs), [selectedLogs]);
    const selectedName = useMemo(() => addictions.find((a) => a.id === selectedTracker)?.name ?? "", [addictions, selectedTracker]);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const dayLogs: DayLog[] = useMemo(() => selectedLogs.map((l) => ({ date: l.date, status: l.status, note: l.note, cost: Number(l.cost) || 0 })), [selectedLogs]);
    const currentYear = new Date().getFullYear();
    const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <div className="w-5 h-5 border border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
                <p className="mt-4 text-xs text-neutral-600">Loading...</p>
                <button onClick={() => { setLoading(false); setError("Manually skipped."); }} className="mt-6 text-xs text-neutral-700 underline hover:text-neutral-500">
                    Taking too long? Click here
                </button>
            </div>
        );
    }

    const quote = getQuoteOfTheDay();

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top bar */}
            <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-900">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 flex h-12 items-center justify-between">
                    <span className="text-sm font-semibold tracking-tight">AddictionTracker</span>
                    <button onClick={handleLogout} disabled={loggingOut} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
                        {loggingOut ? "..." : "Log out"}
                    </button>
                </div>
            </nav>

            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                {/* Error */}
                {error && (
                    <div className="mt-6 p-4 rounded-lg bg-neutral-900 border border-neutral-800 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-neutral-400">{error}</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setError(null); setLoading(true); setRefreshKey((k) => k + 1); }} className="text-xs text-neutral-500 underline">Retry</button>
                                <button onClick={() => setError(null)} className="text-neutral-600 hover:text-neutral-400">&times;</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== HERO / TODAY ===== */}
                <section ref={todayRef} id="today" className="min-h-[70vh] flex flex-col justify-center py-20 scroll-mt-12">
                    <div className="scroll-reveal">
                        <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-[0.9]">{greeting}.</h1>
                        <p className="mt-4 text-sm text-neutral-600">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
                    </div>

                    <div className="mt-12 scroll-reveal" style={{ transitionDelay: "150ms" }}>
                        <p className="text-neutral-500 text-sm italic max-w-md">&ldquo;{quote}&rdquo;</p>
                    </div>

                    {milestoneMessage && (
                        <div className="mt-6 p-4 rounded-lg bg-neutral-900 border border-neutral-800 animate-fade-in max-w-md">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-neutral-300">{milestoneMessage}</p>
                                <button onClick={() => setMilestoneMessage(null)} className="text-neutral-600 hover:text-neutral-400">&times;</button>
                            </div>
                        </div>
                    )}

                    {addictions.length > 0 && (
                        <div className="mt-16 scroll-reveal" style={{ transitionDelay: "300ms" }}>
                            <p className="text-xs text-neutral-600 uppercase tracking-[0.2em] mb-4">Log today</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {addictions.map((addiction) => {
                                    const logs = logsMap[addiction.id] || [];
                                    const streak = calculateStreaks(logs);
                                    const todayLog = logs.find((l) => l.date === todayStr);
                                    return (
                                        <button key={addiction.id} onClick={() => setQuickLogId(addiction.id)}
                                            className={`p-4 rounded-lg border text-left transition-all ${todayLog ? "bg-neutral-900 border-neutral-700" : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-medium text-white">{addiction.name}</h3>
                                                {todayLog && <span className="text-[0.65rem] text-neutral-500 uppercase">{todayLog.status}</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ProgressRing percentage={streak.cleanPercentage} size={36} strokeWidth={3} color="#525252" bgColor="#262626">
                                                    <span className="text-[0.6rem] font-medium text-neutral-400">{streak.currentStreak}</span>
                                                </ProgressRing>
                                                <div className="text-xs text-neutral-500">
                                                    <div>{streak.currentStreak}d streak</div>
                                                    {streak.totalCost > 0 && <div>₹{streak.totalCost.toFixed(0)} spent</div>}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Scroll indicator */}
                    <div className="mt-20 flex justify-center animate-bounce-arrow">
                        <svg className="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7" />
                        </svg>
                    </div>
                </section>

                {/* ===== TRACKERS ===== */}
                <section ref={trackersRef} id="trackers" className="min-h-screen py-24 border-t border-neutral-900 scroll-mt-12">
                    <div className="scroll-reveal">
                        <p className="text-xs text-neutral-600 uppercase tracking-[0.2em] mb-2">Your trackers</p>
                        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">{addictions.length} tracked.</h2>
                    </div>

                    {addictions.length === 0 ? (
                        <div className="mt-16 text-center scroll-reveal">
                            <p className="text-neutral-500 mb-2">No trackers yet.</p>
                            <p className="text-sm text-neutral-700">Add something you want to overcome.</p>
                        </div>
                    ) : (
                        <div className="mt-12 space-y-3">
                            {addictions.map((addiction, i) => {
                                const logs = logsMap[addiction.id] || [];
                                const streak = calculateStreaks(logs);
                                const isSelected = selectedTracker === addiction.id;
                                return (
                                    <div key={addiction.id} onClick={() => setSelectedTracker(addiction.id)}
                                        className={`scroll-reveal p-5 rounded-lg border cursor-pointer transition-all ${isSelected ? "bg-neutral-900 border-neutral-700" : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"}`}
                                        style={{ transitionDelay: `${i * 80}ms` }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <ProgressRing percentage={streak.cleanPercentage} size={48} strokeWidth={3.5} color={isSelected ? "#a3a3a3" : "#404040"} bgColor="#262626">
                                                    <span className="text-xs font-medium text-neutral-400">{streak.cleanPercentage}%</span>
                                                </ProgressRing>
                                                <div>
                                                    <h3 className="text-base font-medium text-white">{addiction.name}</h3>
                                                    <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                                                        <span>{streak.currentStreak}d streak</span>
                                                        <span>{streak.longestStreak}d best</span>
                                                        {streak.totalCost > 0 && <span>₹{streak.totalCost.toFixed(0)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setQuickLogId(addiction.id); }}
                                                    className="px-3 py-1.5 rounded text-xs text-neutral-400 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors">
                                                    Log
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAddiction(addiction.id); }}
                                                    disabled={deletingId === addiction.id}
                                                    className="p-1.5 rounded text-neutral-700 hover:text-neutral-400 transition-colors disabled:opacity-30">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-6 scroll-reveal">
                        <AddAddictionForm onAdd={handleAddAddiction} />
                    </div>
                </section>

                {/* ===== CALENDAR ===== */}
                {selectedTracker && (
                    <section ref={calendarRef} id="calendar" className="min-h-screen py-24 border-t border-neutral-900 scroll-mt-12">
                        <div className="scroll-reveal flex items-center justify-between mb-8">
                            <div>
                                <p className="text-xs text-neutral-600 uppercase tracking-[0.2em] mb-2">Calendar</p>
                                <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">Every day counts.</h2>
                                <p className="text-sm text-neutral-600 mt-2">{selectedName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCalendarYear(calendarYear - 1)} className="p-2 rounded text-neutral-600 hover:text-neutral-400 transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-sm text-neutral-500 font-mono w-12 text-center">{calendarYear}</span>
                                <button onClick={() => setCalendarYear(calendarYear + 1)} disabled={calendarYear >= currentYear}
                                    className="p-2 rounded text-neutral-600 hover:text-neutral-400 transition-colors disabled:opacity-20">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="scroll-reveal" style={{ transitionDelay: "100ms" }}>
                            <CalendarView logs={dayLogs.filter((l) => l.date.startsWith(String(calendarYear)))} year={calendarYear} onSaveLog={handleCalendarLog} />
                        </div>
                    </section>
                )}

                {/* ===== STATS ===== */}
                {selectedTracker && selectedLogs.length > 0 && (
                    <section ref={statsRef} id="stats" className="min-h-screen py-24 border-t border-neutral-900 scroll-mt-12">
                        <div className="scroll-reveal">
                            <p className="text-xs text-neutral-600 uppercase tracking-[0.2em] mb-2">Statistics</p>
                            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight">See your progress.</h2>
                            <p className="text-sm text-neutral-600 mt-2">{selectedName}</p>
                        </div>

                        <div className="mt-12 p-8 rounded-lg bg-neutral-950 border border-neutral-800 scroll-reveal" style={{ transitionDelay: "100ms" }}>
                            <div className="grid grid-cols-5 gap-6">
                                <AnimatedStat value={selectedStreaks.currentStreak} label="Current" />
                                <AnimatedStat value={selectedStreaks.longestStreak} label="Best" />
                                <AnimatedStat value={selectedStreaks.cleanPercentage} label="Clean %" />
                                <AnimatedStat value={selectedStreaks.totalLogs} label="Entries" />
                                <AnimatedStat value={Math.round(selectedStreaks.totalCost)} label="Spent" />
                            </div>
                        </div>

                        {selectedStreaks.monthlySummary.length > 0 && (
                            <>
                                <div className="mt-6 p-6 rounded-lg bg-neutral-950 border border-neutral-800 scroll-reveal overflow-x-auto" style={{ transitionDelay: "200ms" }}>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-neutral-800">
                                                <th className="text-left py-2 text-neutral-500 font-medium">Month</th>
                                                <th className="text-center py-2 text-neutral-500 font-medium">Clean</th>
                                                <th className="text-center py-2 text-neutral-500 font-medium">Relapse</th>
                                                <th className="text-center py-2 text-neutral-500 font-medium">Partial</th>
                                                <th className="text-center py-2 text-neutral-500 font-medium">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStreaks.monthlySummary.map((m) => (
                                                <tr key={`${m.month}-${m.year}`} className="border-b border-neutral-900 last:border-0">
                                                    <td className="py-2.5 text-neutral-300">{m.month} {m.year}</td>
                                                    <td className="text-center py-2.5 text-neutral-400">{m.clean}</td>
                                                    <td className="text-center py-2.5 text-neutral-400">{m.relapse}</td>
                                                    <td className="text-center py-2.5 text-neutral-400">{m.partial}</td>
                                                    <td className="text-center py-2.5 text-neutral-600">₹{m.cost.toFixed(0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-6 scroll-reveal" style={{ transitionDelay: "300ms" }}>
                                    <StatsCharts monthlySummary={selectedStreaks.monthlySummary} addictionName={selectedName} />
                                </div>
                            </>
                        )}

                        <div className="mt-6 scroll-reveal" style={{ transitionDelay: "400ms" }}>
                            <HeatmapGrid logs={selectedLogs} />
                        </div>
                    </section>
                )}

                {/* Footer */}
                <footer className="border-t border-neutral-900 py-8 text-center">
                    <p className="text-xs text-neutral-800">Built by Vedant Kapadia</p>
                </footer>
            </div>

            <BottomNav activeSection={activeSection} onNavigate={handleNavigate} />

            {quickLogId && (
                <LogModal
                    date={todayStr}
                    existingLog={
                        (logsMap[quickLogId] || []).find((l) => l.date === todayStr)
                            ? { date: todayStr, status: (logsMap[quickLogId] || []).find((l) => l.date === todayStr)!.status, note: (logsMap[quickLogId] || []).find((l) => l.date === todayStr)!.note, cost: Number((logsMap[quickLogId] || []).find((l) => l.date === todayStr)!.cost) || 0 }
                            : null
                    }
                    onSave={handleQuickLog}
                    onClose={() => setQuickLogId(null)}
                />
            )}
        </div>
    );
}

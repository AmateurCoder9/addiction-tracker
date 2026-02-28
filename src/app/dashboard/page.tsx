"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AddAddictionForm from "@/components/dashboard/AddAddictionForm";
import BottomNav from "@/components/layout/BottomNav";
import StatsCharts from "@/components/stats/StatsCharts";
import HeatmapGrid from "@/components/stats/HeatmapGrid";

function AnimatedStat({ value, label, icon, gradient }: { value: number; label: string; icon: string; gradient: string }) {
    const { count, ref } = useAnimatedCounter(value);
    return (
        <div ref={ref} className="glass-card p-5 text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{count}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
        </div>
    );
}

export default function DashboardPage() {
    const [addictions, setAddictions] = useState<Addiction[]>([]);
    const [logsMap, setLogsMap] = useState<Record<string, Log[]>>({});
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [quickLogId, setQuickLogId] = useState<string | null>(null);
    const [selectedTracker, setSelectedTracker] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState("today");
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
    const supabaseRef = useRef(createClient());

    const todayRef = useRef<HTMLDivElement>(null);
    const trackersRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    useScrollRevealAll();

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
                    setSelectedTracker((prev) => prev ?? addictionsData[0].id);
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

                    for (const addiction of addictionsData) {
                        const logs = grouped[addiction.id] || [];
                        const streakData = calculateStreaks(logs);
                        if (isMilestoneStreak(streakData.currentStreak)) {
                            setMilestoneMessage(getMilestoneMessage(streakData.currentStreak));
                            fireConfetti();
                            break;
                        }
                    }
                }
            }
            setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, [refreshKey]);

    const handleNavigate = useCallback((section: string) => {
        setActiveSection(section);
        const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
            today: todayRef, trackers: trackersRef, calendar: calendarRef, stats: statsRef,
        };
        refs[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    async function handleAddAddiction(name: string) {
        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase.from("addictions").insert({ user_id: user.id, name });
        if (!error) setRefreshKey((k) => k + 1);
    }

    async function handleDeleteAddiction(id: string) {
        const supabase = supabaseRef.current;
        setDeletingId(id);
        await supabase.from("logs").delete().eq("addiction_id", id);
        const { error } = await supabase.from("addictions").delete().eq("id", id);
        if (!error) {
            setAddictions((prev) => prev.filter((a) => a.id !== id));
            setLogsMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
            if (selectedTracker === id) setSelectedTracker(addictions[0]?.id ?? null);
        }
        setDeletingId(null);
    }

    async function handleQuickLog(status: "clean" | "relapse" | "partial", note: string, cost: number) {
        if (!quickLogId) return;
        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const todayStr = format(new Date(), "yyyy-MM-dd");
        const existingLogs = logsMap[quickLogId] || [];
        const existingLog = existingLogs.find((l) => l.date === todayStr);

        if (existingLog) {
            await supabase.from("logs").update({ status, note: note || null, cost }).eq("id", existingLog.id);
        } else {
            await supabase.from("logs").insert({ user_id: user.id, addiction_id: quickLogId, date: todayStr, status, note: note || null, cost });
        }

        if (status === "clean") fireConfetti();
        setQuickLogId(null);
        setRefreshKey((k) => k + 1);
    }

    async function handleCalendarLog(date: string, status: "clean" | "relapse" | "partial", note: string, cost: number) {
        if (!selectedTracker) return;
        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const logs = logsMap[selectedTracker] || [];
        const existingLog = logs.find((l) => l.date === date);

        if (existingLog) {
            await supabase.from("logs").update({ status, note: note || null, cost }).eq("id", existingLog.id);
        } else {
            await supabase.from("logs").insert({ user_id: user.id, addiction_id: selectedTracker, date, status, note: note || null, cost });
        }

        setRefreshKey((k) => k + 1);
    }

    const selectedLogs = useMemo(() => selectedTracker ? logsMap[selectedTracker] || [] : [], [logsMap, selectedTracker]);
    const selectedStreaks = useMemo(() => calculateStreaks(selectedLogs), [selectedLogs]);
    const selectedName = useMemo(() => addictions.find((a) => a.id === selectedTracker)?.name ?? "", [addictions, selectedTracker]);
    const todayStr = format(new Date(), "yyyy-MM-dd");

    const dayLogs: DayLog[] = useMemo(() => selectedLogs.map((l) => ({
        date: l.date, status: l.status, note: l.note, cost: Number(l.cost) || 0,
    })), [selectedLogs]);

    if (loading) return <LoadingSpinner message="Loading your dashboard..." />;

    const quote = getQuoteOfTheDay();
    const currentYear = new Date().getFullYear();
    const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

    return (
        <>
            <div className="space-y-16 pb-24 md:pb-8">
                {/* ===== SECTION 1: TODAY ===== */}
                <section ref={todayRef} id="today" className="scroll-mt-20">
                    <div className="scroll-reveal">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-1">{greeting} 👋</h1>
                        <p className="text-gray-400 text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
                    </div>

                    {/* Quote */}
                    <div className="mt-6 glass-card p-5 scroll-reveal" style={{ transitionDelay: "100ms" }}>
                        <p className="text-sm text-gray-500 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
                    </div>

                    {/* Milestone */}
                    {milestoneMessage && (
                        <div className="mt-4 glass-card p-5 border-amber-200 bg-amber-50/50 animate-slide-up">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-amber-700">{milestoneMessage}</p>
                                <button onClick={() => setMilestoneMessage(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                        </div>
                    )}

                    {/* Today's Quick Log Cards */}
                    {addictions.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Log Today</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
                                {addictions.map((addiction) => {
                                    const logs = logsMap[addiction.id] || [];
                                    const streak = calculateStreaks(logs);
                                    const todayLog = logs.find((l) => l.date === todayStr);

                                    return (
                                        <button key={addiction.id} onClick={() => setQuickLogId(addiction.id)}
                                            className={`glass-card p-5 text-left transition-all group ${todayLog ? "ring-2 ring-emerald-200" : "hover:ring-2 hover:ring-emerald-100"}`}>
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-semibold text-gray-800">{addiction.name}</h3>
                                                {todayLog ? (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${todayLog.status === "clean" ? "bg-emerald-100 text-emerald-700" :
                                                            todayLog.status === "relapse" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                                                        }`}>{todayLog.status === "clean" ? "✅ Clean" : todayLog.status === "relapse" ? "❌ Relapse" : "⚠️ Partial"}</span>
                                                ) : (
                                                    <span className="text-xs text-gray-300 group-hover:text-emerald-400 transition-colors">Tap to log →</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ProgressRing percentage={streak.cleanPercentage} size={44} strokeWidth={4}>
                                                    <span className="text-xs font-bold text-gray-600">{streak.currentStreak}</span>
                                                </ProgressRing>
                                                <div>
                                                    <div className="text-xs text-gray-400">{streak.currentStreak} day streak</div>
                                                    {streak.totalCost > 0 && <div className="text-xs text-red-400">₹{streak.totalCost.toFixed(0)} spent</div>}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>

                {/* ===== SECTION 2: TRACKERS ===== */}
                <section ref={trackersRef} id="trackers" className="scroll-mt-20">
                    <div className="scroll-reveal">
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">Your Trackers</h2>
                        <p className="text-gray-400 text-sm mb-6">{addictions.length} addiction{addictions.length !== 1 ? "s" : ""} tracked</p>
                    </div>

                    {addictions.length === 0 ? (
                        <div className="text-center py-16 scroll-reveal">
                            <div className="text-6xl mb-4">🌱</div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">Start your journey</h3>
                            <p className="text-gray-400 text-sm mb-8">Add something you want to overcome.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 scroll-reveal">
                            {addictions.map((addiction) => {
                                const logs = logsMap[addiction.id] || [];
                                const streak = calculateStreaks(logs);
                                const isSelected = selectedTracker === addiction.id;

                                return (
                                    <div key={addiction.id}
                                        className={`glass-card p-5 cursor-pointer transition-all ${isSelected ? "ring-2 ring-emerald-300 shadow-lg shadow-emerald-100/50" : ""}`}
                                        onClick={() => setSelectedTracker(addiction.id)}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <ProgressRing percentage={streak.cleanPercentage} size={56} strokeWidth={5}
                                                    color={isSelected ? "#10b981" : "#d1d5db"}>
                                                    <span className="text-sm font-bold text-gray-700">{streak.cleanPercentage}%</span>
                                                </ProgressRing>
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">{addiction.name}</h3>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs text-gray-400">🔥 {streak.currentStreak} days</span>
                                                        <span className="text-xs text-gray-400">🏆 {streak.longestStreak} best</span>
                                                        {streak.totalCost > 0 && <span className="text-xs text-red-400">💸 ₹{streak.totalCost.toFixed(0)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setQuickLogId(addiction.id); }}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all">
                                                    ⚡ Log
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAddiction(addiction.id); }}
                                                    disabled={deletingId === addiction.id}
                                                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-4 scroll-reveal">
                        <AddAddictionForm onAdd={handleAddAddiction} />
                    </div>
                </section>

                {/* ===== SECTION 3: CALENDAR ===== */}
                {selectedTracker && (
                    <section ref={calendarRef} id="calendar" className="scroll-mt-20">
                        <div className="scroll-reveal">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Calendar</h2>
                                    <p className="text-gray-400 text-sm">{selectedName} — {calendarYear}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCalendarYear(calendarYear - 1)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <span className="text-sm font-medium text-gray-600 min-w-[3rem] text-center">{calendarYear}</span>
                                    <button onClick={() => setCalendarYear(calendarYear + 1)} disabled={calendarYear >= currentYear}
                                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-30">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="scroll-reveal" style={{ transitionDelay: "100ms" }}>
                            <CalendarView
                                logs={dayLogs.filter((l) => l.date.startsWith(String(calendarYear)))}
                                year={calendarYear}
                                onSaveLog={handleCalendarLog}
                            />
                        </div>
                    </section>
                )}

                {/* ===== SECTION 4: STATS ===== */}
                {selectedTracker && selectedLogs.length > 0 && (
                    <section ref={statsRef} id="stats" className="scroll-mt-20">
                        <div className="scroll-reveal">
                            <h2 className="text-2xl font-bold text-gray-800 mb-1">Statistics</h2>
                            <p className="text-gray-400 text-sm mb-6">{selectedName}</p>
                        </div>

                        {/* Animated stat cards */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 scroll-reveal" style={{ transitionDelay: "100ms" }}>
                            <AnimatedStat value={selectedStreaks.currentStreak} label="Current Streak" icon="🔥" gradient="from-emerald-500 to-teal-500" />
                            <AnimatedStat value={selectedStreaks.longestStreak} label="Best Streak" icon="🏆" gradient="from-amber-400 to-orange-400" />
                            <AnimatedStat value={selectedStreaks.cleanPercentage} label="Clean Rate %" icon="✅" gradient="from-green-500 to-emerald-500" />
                            <AnimatedStat value={selectedStreaks.totalLogs} label="Total Entries" icon="📝" gradient="from-sky-500 to-blue-500" />
                            <AnimatedStat value={Math.round(selectedStreaks.totalCost)} label="Money Spent ₹" icon="💸" gradient="from-red-400 to-rose-500" />
                        </div>

                        {/* Monthly Summary */}
                        {selectedStreaks.monthlySummary.length > 0 && (
                            <div className="mt-6 scroll-reveal" style={{ transitionDelay: "200ms" }}>
                                <div className="glass-card p-5 overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100">
                                                <th className="text-left py-2 text-gray-400 font-medium">Month</th>
                                                <th className="text-center py-2 text-emerald-600 font-medium">Clean</th>
                                                <th className="text-center py-2 text-red-500 font-medium">Relapse</th>
                                                <th className="text-center py-2 text-amber-500 font-medium">Partial</th>
                                                <th className="text-center py-2 text-gray-400 font-medium">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStreaks.monthlySummary.map((m) => (
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

                        {/* Charts */}
                        {selectedStreaks.monthlySummary.length > 0 && (
                            <div className="mt-6 scroll-reveal" style={{ transitionDelay: "300ms" }}>
                                <StatsCharts monthlySummary={selectedStreaks.monthlySummary} addictionName={selectedName} />
                            </div>
                        )}

                        {/* Heatmap */}
                        <div className="mt-6 scroll-reveal" style={{ transitionDelay: "400ms" }}>
                            <HeatmapGrid logs={selectedLogs} />
                        </div>
                    </section>
                )}

                {/* ===== MOTIVATION ===== */}
                <section className="scroll-reveal py-12 text-center">
                    <div className="text-4xl mb-4">💪</div>
                    <p className="text-xl font-medium text-gray-600 italic max-w-lg mx-auto">&ldquo;{quote}&rdquo;</p>
                    <p className="text-sm text-gray-300 mt-4">One day at a time.</p>
                </section>
            </div>

            {/* Bottom Nav (Mobile) */}
            <BottomNav activeSection={activeSection} onNavigate={handleNavigate} />

            {/* Quick Log Modal */}
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
        </>
    );
}

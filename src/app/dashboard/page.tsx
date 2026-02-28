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

function AnimatedStat({ value, label }: { value: number; label: string }) {
    const { count, ref } = useAnimatedCounter(value);
    return (
        <div ref={ref} className="text-center">
            <div className="text-2xl font-light text-neutral-900">{count}</div>
            <div className="text-[0.65rem] text-neutral-400 mt-0.5">{label}</div>
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
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user || cancelled) { setLoading(false); return; }

                const { data: addictionsData, error: addErr } = await supabase.from("addictions").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
                if (cancelled) return;

                if (addErr) { console.error("addictions error:", addErr); setLoading(false); return; }

                if (addictionsData) {
                    setAddictions(addictionsData);
                    if (addictionsData.length > 0) setSelectedTracker((prev) => prev ?? addictionsData[0].id);

                    const { data: logsData, error: logErr } = await supabase.from("logs").select("*").eq("user_id", user.id).order("date", { ascending: true });
                    if (cancelled) return;

                    if (logErr) { console.error("logs error:", logErr); }

                    if (logsData) {
                        const grouped: Record<string, Log[]> = {};
                        for (const log of logsData) {
                            if (!grouped[log.addiction_id]) grouped[log.addiction_id] = [];
                            grouped[log.addiction_id].push(log);
                        }
                        setLogsMap(grouped);

                        for (const addiction of addictionsData) {
                            const streakData = calculateStreaks(grouped[addiction.id] || []);
                            if (isMilestoneStreak(streakData.currentStreak)) {
                                setMilestoneMessage(getMilestoneMessage(streakData.currentStreak));
                                fireConfetti();
                                break;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Dashboard load error:", err);
            }
            setLoading(false);
        }

        load();
        return () => { cancelled = true; };
    }, [refreshKey]);

    const handleNavigate = useCallback((section: string) => {
        setActiveSection(section);
        const refs: Record<string, React.RefObject<HTMLDivElement | null>> = { today: todayRef, trackers: trackersRef, calendar: calendarRef, stats: statsRef };
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
        const existing = (logsMap[quickLogId] || []).find((l) => l.date === todayStr);

        if (existing) {
            await supabase.from("logs").update({ status, note: note || null, cost }).eq("id", existing.id);
        } else {
            await supabase.from("logs").insert({ user_id: user.id, addiction_id: quickLogId, date: todayStr, status, note: note || null, cost });
        }

        setQuickLogId(null);
        setRefreshKey((k) => k + 1);
    }

    async function handleCalendarLog(date: string, status: "clean" | "relapse" | "partial", note: string, cost: number) {
        if (!selectedTracker) return;
        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const existing = (logsMap[selectedTracker] || []).find((l) => l.date === date);

        if (existing) {
            await supabase.from("logs").update({ status, note: note || null, cost }).eq("id", existing.id);
        } else {
            await supabase.from("logs").insert({ user_id: user.id, addiction_id: selectedTracker, date, status, note: note || null, cost });
        }

        setRefreshKey((k) => k + 1);
    }

    const selectedLogs = useMemo(() => selectedTracker ? logsMap[selectedTracker] || [] : [], [logsMap, selectedTracker]);
    const selectedStreaks = useMemo(() => calculateStreaks(selectedLogs), [selectedLogs]);
    const selectedName = useMemo(() => addictions.find((a) => a.id === selectedTracker)?.name ?? "", [addictions, selectedTracker]);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const dayLogs: DayLog[] = useMemo(() => selectedLogs.map((l) => ({ date: l.date, status: l.status, note: l.note, cost: Number(l.cost) || 0 })), [selectedLogs]);
    const currentYear = new Date().getFullYear();
    const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

    if (loading) return <LoadingSpinner message="Loading..." />;

    const quote = getQuoteOfTheDay();

    return (
        <>
            <div className="space-y-16 pb-24 md:pb-8">
                {/* TODAY */}
                <section ref={todayRef} id="today" className="scroll-mt-16">
                    <div className="scroll-reveal">
                        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">{greeting}</h1>
                        <p className="text-xs text-neutral-400 mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
                    </div>

                    <div className="mt-5 card p-4 scroll-reveal" style={{ transitionDelay: "100ms" }}>
                        <p className="text-sm text-neutral-500 italic">&ldquo;{quote}&rdquo;</p>
                    </div>

                    {milestoneMessage && (
                        <div className="mt-3 card p-4 border-neutral-300 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-neutral-700">{milestoneMessage}</p>
                                <button onClick={() => setMilestoneMessage(null)} className="text-neutral-300 hover:text-neutral-500 text-sm">&times;</button>
                            </div>
                        </div>
                    )}

                    {addictions.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-[0.15em] mb-3">Log today</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {addictions.map((addiction) => {
                                    const logs = logsMap[addiction.id] || [];
                                    const streak = calculateStreaks(logs);
                                    const todayLog = logs.find((l) => l.date === todayStr);

                                    return (
                                        <button key={addiction.id} onClick={() => setQuickLogId(addiction.id)}
                                            className={`card p-4 text-left transition-all ${todayLog ? "border-neutral-400" : "hover:border-neutral-300"}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-sm font-medium text-neutral-900">{addiction.name}</h3>
                                                {todayLog && (
                                                    <span className="text-[0.65rem] text-neutral-500 font-medium uppercase">{todayLog.status}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ProgressRing percentage={streak.cleanPercentage} size={36} strokeWidth={3} color="#737373" bgColor="#f5f5f5">
                                                    <span className="text-[0.6rem] font-medium text-neutral-600">{streak.currentStreak}</span>
                                                </ProgressRing>
                                                <div className="text-xs text-neutral-400">
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
                </section>

                {/* TRACKERS */}
                <section ref={trackersRef} id="trackers" className="scroll-mt-16">
                    <div className="scroll-reveal">
                        <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Trackers</h2>
                        <p className="text-xs text-neutral-400 mt-0.5">{addictions.length} tracked</p>
                    </div>

                    {addictions.length === 0 ? (
                        <div className="text-center py-16 scroll-reveal">
                            <h3 className="text-sm text-neutral-500 mb-1">No trackers yet</h3>
                            <p className="text-xs text-neutral-400">Add something you want to overcome.</p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-2 scroll-reveal">
                            {addictions.map((addiction) => {
                                const logs = logsMap[addiction.id] || [];
                                const streak = calculateStreaks(logs);
                                const isSelected = selectedTracker === addiction.id;

                                return (
                                    <div key={addiction.id} onClick={() => setSelectedTracker(addiction.id)}
                                        className={`card p-4 cursor-pointer ${isSelected ? "border-neutral-400" : ""}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <ProgressRing percentage={streak.cleanPercentage} size={44} strokeWidth={3.5} color={isSelected ? "#525252" : "#d4d4d4"} bgColor="#f5f5f5">
                                                    <span className="text-xs font-medium text-neutral-600">{streak.cleanPercentage}%</span>
                                                </ProgressRing>
                                                <div>
                                                    <h3 className="text-sm font-medium text-neutral-900">{addiction.name}</h3>
                                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                                                        <span>{streak.currentStreak}d streak</span>
                                                        <span>{streak.longestStreak}d best</span>
                                                        {streak.totalCost > 0 && <span>₹{streak.totalCost.toFixed(0)}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={(e) => { e.stopPropagation(); setQuickLogId(addiction.id); }}
                                                    className="px-2.5 py-1 rounded text-xs text-neutral-500 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 transition-colors">
                                                    Log
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAddiction(addiction.id); }}
                                                    disabled={deletingId === addiction.id}
                                                    className="p-1 rounded text-neutral-300 hover:text-neutral-500 transition-colors disabled:opacity-30">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

                    <div className="mt-3 scroll-reveal">
                        <AddAddictionForm onAdd={handleAddAddiction} />
                    </div>
                </section>

                {/* CALENDAR */}
                {selectedTracker && (
                    <section ref={calendarRef} id="calendar" className="scroll-mt-16">
                        <div className="scroll-reveal flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Calendar</h2>
                                <p className="text-xs text-neutral-400">{selectedName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setCalendarYear(calendarYear - 1)} className="p-1.5 rounded text-neutral-400 hover:text-neutral-600 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-xs text-neutral-500 font-mono w-10 text-center">{calendarYear}</span>
                                <button onClick={() => setCalendarYear(calendarYear + 1)} disabled={calendarYear >= currentYear}
                                    className="p-1.5 rounded text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-20">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                        <div className="scroll-reveal" style={{ transitionDelay: "100ms" }}>
                            <CalendarView logs={dayLogs.filter((l) => l.date.startsWith(String(calendarYear)))} year={calendarYear} onSaveLog={handleCalendarLog} />
                        </div>
                    </section>
                )}

                {/* STATS */}
                {selectedTracker && selectedLogs.length > 0 && (
                    <section ref={statsRef} id="stats" className="scroll-mt-16">
                        <div className="scroll-reveal">
                            <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Statistics</h2>
                            <p className="text-xs text-neutral-400 mb-4">{selectedName}</p>
                        </div>

                        <div className="card p-5 scroll-reveal" style={{ transitionDelay: "100ms" }}>
                            <div className="grid grid-cols-5 gap-4">
                                <AnimatedStat value={selectedStreaks.currentStreak} label="Current" />
                                <AnimatedStat value={selectedStreaks.longestStreak} label="Best" />
                                <AnimatedStat value={selectedStreaks.cleanPercentage} label="Clean %" />
                                <AnimatedStat value={selectedStreaks.totalLogs} label="Entries" />
                                <AnimatedStat value={Math.round(selectedStreaks.totalCost)} label="Spent" />
                            </div>
                        </div>

                        {selectedStreaks.monthlySummary.length > 0 && (
                            <>
                                <div className="mt-4 card p-5 scroll-reveal overflow-x-auto" style={{ transitionDelay: "200ms" }}>
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-neutral-100">
                                                <th className="text-left py-2 text-neutral-400 font-medium">Month</th>
                                                <th className="text-center py-2 text-neutral-400 font-medium">Clean</th>
                                                <th className="text-center py-2 text-neutral-400 font-medium">Relapse</th>
                                                <th className="text-center py-2 text-neutral-400 font-medium">Partial</th>
                                                <th className="text-center py-2 text-neutral-400 font-medium">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedStreaks.monthlySummary.map((m) => (
                                                <tr key={`${m.month}-${m.year}`} className="border-b border-neutral-50 last:border-0">
                                                    <td className="py-2 text-neutral-700">{m.month} {m.year}</td>
                                                    <td className="text-center py-2 text-neutral-600">{m.clean}</td>
                                                    <td className="text-center py-2 text-neutral-600">{m.relapse}</td>
                                                    <td className="text-center py-2 text-neutral-600">{m.partial}</td>
                                                    <td className="text-center py-2 text-neutral-400">₹{m.cost.toFixed(0)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 scroll-reveal" style={{ transitionDelay: "300ms" }}>
                                    <StatsCharts monthlySummary={selectedStreaks.monthlySummary} addictionName={selectedName} />
                                </div>
                            </>
                        )}

                        <div className="mt-4 scroll-reveal" style={{ transitionDelay: "400ms" }}>
                            <HeatmapGrid logs={selectedLogs} />
                        </div>
                    </section>
                )}
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
        </>
    );
}

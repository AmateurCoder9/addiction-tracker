"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateStreaks, isMilestoneStreak, getMilestoneMessage } from "@/lib/streaks";
import { getQuoteOfTheDay } from "@/lib/quotes";
import { fireConfetti } from "@/lib/confetti";
import type { Addiction, Log } from "@/lib/types";
import AddictionCard from "@/components/dashboard/AddictionCard";
import AddAddictionForm from "@/components/dashboard/AddAddictionForm";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function DashboardPage() {
    const [addictions, setAddictions] = useState<Addiction[]>([]);
    const [logsMap, setLogsMap] = useState<Record<string, Log[]>>({});
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
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

            const { data: addictionsData } = await supabase
                .from("addictions")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

            if (cancelled) return;

            if (addictionsData) {
                setAddictions(addictionsData);

                const { data: logsData } = await supabase
                    .from("logs")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("date", { ascending: true });

                if (cancelled) return;

                if (logsData) {
                    const grouped: Record<string, Log[]> = {};
                    for (const log of logsData) {
                        if (!grouped[log.addiction_id]) {
                            grouped[log.addiction_id] = [];
                        }
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

    async function handleAddAddiction(name: string) {
        const supabase = supabaseRef.current;
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("addictions").insert({
            user_id: user.id,
            name,
        });

        if (!error) {
            setRefreshKey((k) => k + 1);
        }
    }

    async function handleDeleteAddiction(id: string) {
        const supabase = supabaseRef.current;
        setDeletingId(id);

        await supabase.from("logs").delete().eq("addiction_id", id);
        const { error } = await supabase.from("addictions").delete().eq("id", id);

        if (!error) {
            setAddictions((prev) => prev.filter((a) => a.id !== id));
            setLogsMap((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }

        setDeletingId(null);
    }

    if (loading) {
        return <LoadingSpinner message="Loading your dashboard..." />;
    }

    const quote = getQuoteOfTheDay();

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 mt-1 text-sm">Track your journey, one day at a time.</p>
            </div>

            {/* Motivational Quote */}
            <div className="glass-card p-5 border-purple-500/20">
                <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">💬</span>
                    <p className="text-sm text-gray-300 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
                </div>
            </div>

            {/* Milestone Toast */}
            {milestoneMessage && (
                <div className="glass-card p-5 border-yellow-500/30 bg-yellow-500/5 animate-slide-up">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-yellow-300">{milestoneMessage}</p>
                        <button
                            onClick={() => setMilestoneMessage(null)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Addictions Grid */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🎯</span> Your Trackers
                    <span className="text-sm font-normal text-gray-500">({addictions.length})</span>
                </h2>

                {addictions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">🌱</div>
                        <h3 className="text-lg font-medium text-gray-300 mb-2">
                            No addictions tracked yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Start by adding something you want to overcome.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {addictions.map((addiction) => {
                            const logs = logsMap[addiction.id] || [];
                            const streakData = calculateStreaks(logs);
                            return (
                                <AddictionCard
                                    key={addiction.id}
                                    addiction={addiction}
                                    currentStreak={streakData.currentStreak}
                                    totalLogs={streakData.totalLogs}
                                    onDelete={handleDeleteAddiction}
                                    deleting={deletingId === addiction.id}
                                />
                            );
                        })}
                    </div>
                )}

                <div className="mt-4">
                    <AddAddictionForm onAdd={handleAddAddiction} />
                </div>
            </div>
        </div>
    );
}

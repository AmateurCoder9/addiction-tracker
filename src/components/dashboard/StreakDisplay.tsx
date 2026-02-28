"use client";

import type { StreakData } from "@/lib/types";

interface StreakDisplayProps {
    streakData: StreakData;
    addictionName: string;
}

export default function StreakDisplay({ streakData, addictionName }: StreakDisplayProps) {
    const stats = [
        {
            label: "Current Streak",
            value: streakData.currentStreak,
            suffix: "days",
            icon: "🔥",
            color: "from-orange-400 to-red-500",
        },
        {
            label: "Longest Streak",
            value: streakData.longestStreak,
            suffix: "days",
            icon: "🏆",
            color: "from-yellow-400 to-amber-500",
        },
        {
            label: "Clean Days",
            value: streakData.totalClean,
            suffix: `(${streakData.cleanPercentage}%)`,
            icon: "✅",
            color: "from-green-400 to-emerald-500",
        },
        {
            label: "Total Relapses",
            value: streakData.totalRelapses,
            suffix: `(${streakData.relapsePercentage}%)`,
            icon: "⚠️",
            color: "from-red-400 to-rose-500",
        },
    ];

    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-purple-400">📊</span>
                {addictionName} — Streak Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
                {stats.map((stat) => (
                    <div key={stat.label} className="glass-card p-4 text-center">
                        <div className="text-2xl mb-1">{stat.icon}</div>
                        <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                            {stat.value}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{stat.suffix}</div>
                        <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

"use client";

import Link from "next/link";
import type { Addiction } from "@/lib/types";

interface AddictionCardProps {
    addiction: Addiction;
    currentStreak: number;
    totalLogs: number;
    totalCost: number;
    onDelete: (id: string) => void;
    onQuickLog: (id: string) => void;
    deleting: boolean;
}

export default function AddictionCard({
    addiction,
    currentStreak,
    totalLogs,
    totalCost,
    onDelete,
    onQuickLog,
    deleting,
}: AddictionCardProps) {
    return (
        <div className="glass-card p-5 group animate-fade-in">
            <div className="flex items-start justify-between mb-3">
                <Link href={`/dashboard/${addiction.id}`} className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
                        {addiction.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Added {new Date(addiction.created_at).toLocaleDateString()}
                    </p>
                </Link>
                <button
                    onClick={() => onDelete(addiction.id)}
                    disabled={deleting}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                    aria-label={`Delete ${addiction.name}`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <Link href={`/dashboard/${addiction.id}`}>
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm">🔥</span>
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                {currentStreak}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">day streak</span>
                        </div>
                    </div>
                    <div className="text-right space-y-0.5">
                        <div className="text-sm text-gray-400">{totalLogs} entries</div>
                        {totalCost > 0 && (
                            <div className="text-xs text-red-400 font-medium">₹{totalCost.toFixed(0)} spent</div>
                        )}
                    </div>
                </div>

                <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-500"
                        style={{ width: `${Math.min(currentStreak * 3.33, 100)}%` }}
                    />
                </div>
            </Link>

            {/* Quick Log Button */}
            <button
                onClick={() => onQuickLog(addiction.id)}
                className="mt-3 w-full py-2 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-all duration-200 flex items-center justify-center gap-1.5"
            >
                <span>⚡</span> Quick Log Today
            </button>
        </div>
    );
}

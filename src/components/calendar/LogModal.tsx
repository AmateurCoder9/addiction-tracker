"use client";

import { useState } from "react";
import type { DayLog } from "@/lib/types";

interface LogModalProps {
    date: string;
    existingLog: DayLog | null;
    onSave: (status: "clean" | "relapse" | "partial", note: string, cost: number) => Promise<void>;
    onClose: () => void;
}

export default function LogModal({ date, existingLog, onSave, onClose }: LogModalProps) {
    const [status, setStatus] = useState<"clean" | "relapse" | "partial">(
        existingLog?.status ?? "clean"
    );
    const [note, setNote] = useState(existingLog?.note ?? "");
    const [cost, setCost] = useState(existingLog?.cost ?? 0);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        await onSave(status, note, cost);
        setSaving(false);
    }

    const statusOptions: { value: "clean" | "relapse" | "partial"; label: string; emoji: string; cls: string }[] = [
        { value: "clean", label: "Clean", emoji: "✅", cls: "status-clean" },
        { value: "relapse", label: "Relapse", emoji: "❌", cls: "status-relapse" },
        { value: "partial", label: "Partial", emoji: "⚠️", cls: "status-partial" },
    ];

    const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Log Entry</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-5">{formattedDate}</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            How did this day go?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {statusOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setStatus(opt.value)}
                                    className={`p-3 rounded-xl text-center text-sm font-medium transition-all duration-200 ${status === opt.value
                                            ? `${opt.cls} ring-2 ring-offset-1 scale-105`
                                            : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"
                                        }`}
                                >
                                    <div className="text-xl mb-1">{opt.emoji}</div>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cost input */}
                    <div>
                        <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Money spent <span className="text-gray-400">(₹)</span>
                        </label>
                        <input
                            id="cost"
                            type="number"
                            min="0"
                            step="0.01"
                            value={cost || ""}
                            onChange={(e) => setCost(Number(e.target.value) || 0)}
                            className="input-field"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Note <span className="text-gray-400">(optional)</span>
                        </label>
                        <textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="input-field min-h-[80px] resize-none"
                            placeholder="How are you feeling today?"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : existingLog ? (
                                "Update"
                            ) : (
                                "Save"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

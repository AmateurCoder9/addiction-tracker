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
    const [status, setStatus] = useState<"clean" | "relapse" | "partial">(existingLog?.status ?? "clean");
    const [note, setNote] = useState(existingLog?.note ?? "");
    const [cost, setCost] = useState(existingLog?.cost ?? 0);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        await onSave(status, note, cost);
        setSaving(false);
    }

    const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const statusOptions: { value: "clean" | "relapse" | "partial"; label: string }[] = [
        { value: "clean", label: "Clean" },
        { value: "relapse", label: "Relapse" },
        { value: "partial", label: "Partial" },
    ];

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 w-full max-w-sm animate-slide-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-white">Log entry</h3>
                    <button onClick={onClose} className="text-neutral-600 hover:text-neutral-400 text-lg leading-none">&times;</button>
                </div>
                <p className="text-xs text-neutral-600 mb-5">{formattedDate}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-2">Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            {statusOptions.map((opt) => (
                                <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                                    className={`py-2.5 rounded-md text-xs font-medium transition-all border ${status === opt.value
                                            ? "bg-white text-black border-white"
                                            : "bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700"
                                        }`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="cost" className="block text-xs font-medium text-neutral-500 mb-1">Amount spent</label>
                        <input id="cost" type="number" min="0" step="0.01" value={cost || ""} onChange={(e) => setCost(Number(e.target.value) || 0)} className="input-field input-dark" placeholder="0.00" />
                    </div>

                    <div>
                        <label htmlFor="note" className="block text-xs font-medium text-neutral-500 mb-1">Note</label>
                        <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="input-field input-dark min-h-[60px] resize-none" placeholder="Optional" rows={2} />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-md text-xs text-neutral-500 border border-neutral-800 hover:border-neutral-700 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-md text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-40">
                            {saving ? "Saving..." : existingLog ? "Update" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

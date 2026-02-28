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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-neutral-900">Log entry</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors text-lg leading-none">&times;</button>
                </div>

                <p className="text-xs text-neutral-400 mb-5">{formattedDate}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-2">Status</label>
                        <div className="grid grid-cols-3 gap-2">
                            {statusOptions.map((opt) => (
                                <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                                    className={`py-2 rounded-md text-xs font-medium transition-all ${status === opt.value ? `status-${opt.value} ring-1 ring-neutral-400` : "bg-neutral-50 text-neutral-400 border border-neutral-200 hover:border-neutral-300"
                                        }`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="cost" className="block text-xs font-medium text-neutral-500 mb-1">Amount spent</label>
                        <input id="cost" type="number" min="0" step="0.01" value={cost || ""} onChange={(e) => setCost(Number(e.target.value) || 0)} className="input-field" placeholder="0.00" />
                    </div>

                    <div>
                        <label htmlFor="note" className="block text-xs font-medium text-neutral-500 mb-1">Note</label>
                        <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="input-field min-h-[60px] resize-none" placeholder="Optional" rows={2} />
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 btn-ghost text-xs">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 btn-primary text-xs">
                            {saving ? "Saving..." : existingLog ? "Update" : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

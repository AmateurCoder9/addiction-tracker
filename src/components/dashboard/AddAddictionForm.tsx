"use client";

import { useState } from "react";

interface AddAddictionFormProps {
    onAdd: (name: string) => Promise<void>;
}

export default function AddAddictionForm({ onAdd }: AddAddictionFormProps) {
    const [name, setName] = useState("");
    const [adding, setAdding] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim()) return;
        setAdding(true);
        await onAdd(name.trim());
        setName("");
        setAdding(false);
        setIsOpen(false);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="glass-card p-5 w-full text-left hover:border-emerald-200 group transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-100 transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
                            Track a new addiction
                        </p>
                        <p className="text-xs text-gray-400">Click to add</p>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <div className="glass-card p-5 animate-fade-in">
            <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field flex-1"
                    placeholder="e.g. Smoking, Social Media, Sugar..."
                    autoFocus
                    maxLength={100}
                />
                <button type="submit" disabled={adding || !name.trim()} className="btn-primary whitespace-nowrap">
                    {adding ? "Adding..." : "Add"}
                </button>
                <button
                    type="button"
                    onClick={() => { setIsOpen(false); setName(""); }}
                    className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all"
                >
                    Cancel
                </button>
            </form>
        </div>
    );
}

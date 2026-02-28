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
            <button onClick={() => setIsOpen(true)} className="w-full p-4 rounded-lg border border-dashed border-neutral-800 text-left hover:border-neutral-700 transition-colors">
                <span className="text-sm text-neutral-600">+ Add tracker</span>
            </button>
        );
    }

    return (
        <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 animate-fade-in">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field input-dark flex-1 text-sm" placeholder="e.g. Smoking, Social Media..." autoFocus maxLength={100} />
                <button type="submit" disabled={adding || !name.trim()} className="px-4 py-2 rounded-md text-xs font-medium bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-40">
                    {adding ? "..." : "Add"}
                </button>
                <button type="button" onClick={() => { setIsOpen(false); setName(""); }} className="px-3 py-2 rounded-md text-xs text-neutral-500 border border-neutral-700 hover:border-neutral-600 transition-colors">
                    Cancel
                </button>
            </form>
        </div>
    );
}

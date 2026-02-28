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
            <button onClick={() => setIsOpen(true)} className="card p-4 w-full text-left hover:border-neutral-300 transition-colors">
                <span className="text-sm text-neutral-400">+ Add tracker</span>
            </button>
        );
    }

    return (
        <div className="card p-4 animate-fade-in">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field flex-1 text-sm" placeholder="e.g. Smoking, Social Media..." autoFocus maxLength={100} />
                <button type="submit" disabled={adding || !name.trim()} className="btn-primary text-xs px-4">
                    {adding ? "..." : "Add"}
                </button>
                <button type="button" onClick={() => { setIsOpen(false); setName(""); }} className="btn-ghost text-xs">
                    Cancel
                </button>
            </form>
        </div>
    );
}

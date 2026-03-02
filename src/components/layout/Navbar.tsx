"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Navbar() {
    const router = useRouter();

    async function handleLogout() {
        try { await signOut(auth); } catch (e) { console.error(e); }
        router.push("/login");
    }

    return (
        <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-neutral-900">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 flex h-12 items-center justify-between">
                <span className="text-sm font-semibold tracking-tight text-white">AddictionTracker</span>
                <button onClick={handleLogout} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Log out</button>
            </div>
        </nav>
    );
}

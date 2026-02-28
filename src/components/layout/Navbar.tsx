"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export default function Navbar() {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [now, setNow] = useState<Date | null>(null);
    const supabase = createClient();

    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    async function handleLogout() {
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.push("/login");
    }

    const time = now ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
    const date = now ? now.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
                <div className="flex h-12 items-center justify-between">
                    <Link href="/dashboard" className="text-sm font-semibold text-neutral-900 tracking-tight">
                        AddictionTracker
                    </Link>

                    <div className="flex items-center gap-4">
                        {now && (
                            <span className="hidden sm:inline text-xs text-neutral-400 font-mono">
                                {date} {time}
                            </span>
                        )}
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-40"
                        >
                            {loggingOut ? "..." : "Log out"}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

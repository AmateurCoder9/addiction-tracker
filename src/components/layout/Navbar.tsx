"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
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

    const formattedDate = now
        ? now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })
        : "";
    const formattedTime = now
        ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
        : "";

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <span className="text-xl">🛡️</span>
                        <span className="text-lg font-bold gradient-text-green">AddictionTracker</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {now && (
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-xs text-gray-400">{formattedDate}</span>
                                <span className="text-xs font-mono font-semibold gradient-text-green">{formattedTime}</span>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                            {loggingOut ? "..." : "Logout"}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

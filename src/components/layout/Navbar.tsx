"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
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

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/dashboard/stats", label: "Statistics", icon: "📈" },
    ];

    const formattedDate = now
        ? now.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
        : "";
    const formattedTime = now
        ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
        : "";

    return (
        <nav className="sticky top-0 z-50 border-b border-emerald-100 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 group">
                            <span className="text-2xl">🛡️</span>
                            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 bg-clip-text text-transparent group-hover:from-teal-500 group-hover:via-sky-500 group-hover:to-emerald-500 transition-all duration-500">
                                AddictionTracker
                            </span>
                        </Link>

                        {/* Live Clock */}
                        {now && (
                            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-emerald-100">
                                <span className="text-xs text-gray-400">{formattedDate}</span>
                                <span className="text-xs font-mono font-semibold bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
                                    {formattedTime}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === item.href
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                            >
                                <span className="mr-1.5">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}

                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 disabled:opacity-50"
                        >
                            {loggingOut ? "..." : "Logout"}
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all"
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden pb-4 border-t border-emerald-50 mt-2 pt-4 space-y-1 animate-fade-in">
                        {/* Mobile clock */}
                        {now && (
                            <div className="px-4 pb-3 mb-2 border-b border-emerald-50 flex items-center gap-2">
                                <span className="text-xs text-gray-400">{formattedDate}</span>
                                <span className="text-xs font-mono font-semibold bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
                                    {formattedTime}
                                </span>
                            </div>
                        )}
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === item.href
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
                        >
                            {loggingOut ? "Logging out..." : "🚪 Logout"}
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}

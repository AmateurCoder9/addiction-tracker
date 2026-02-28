"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [loggingOut, setLoggingOut] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const supabase = createClient();

    async function handleLogout() {
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.push("/login");
    }

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: "📊" },
        { href: "/dashboard/stats", label: "Statistics", icon: "📈" },
    ];

    return (
        <nav className="sticky top-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl dark:bg-gray-950/80 light:bg-white/80 light:border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <span className="text-2xl">🛡️</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent group-hover:from-pink-400 group-hover:via-indigo-400 group-hover:to-purple-400 transition-all duration-500">
                            AddictionTracker
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === item.href
                                        ? "bg-purple-500/20 text-purple-300"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <span className="mr-1.5">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}

                        <button
                            onClick={toggleTheme}
                            className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? "☀️" : "🌙"}
                        </button>

                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 disabled:opacity-50"
                        >
                            {loggingOut ? "..." : "Logout"}
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
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
                    <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4 space-y-1 animate-in slide-in-from-top-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${pathname === item.href
                                        ? "bg-purple-500/20 text-purple-300"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                        <button
                            onClick={toggleTheme}
                            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                        >
                            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                        </button>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
                        >
                            {loggingOut ? "Logging out..." : "🚪 Logout"}
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}

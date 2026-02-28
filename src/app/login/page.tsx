"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        router.push("/dashboard");
        router.refresh();
    }

    async function handleGuestMode() {
        setGuestLoading(true);
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) {
            setError(authError.message);
            setGuestLoading(false);
            return;
        }
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <div className="min-h-screen section-dark flex flex-col items-center justify-center px-6">
            <div className="glow-green" style={{ top: "10%", left: "30%", opacity: 0.4 }} />
            <div className="glow-blue" style={{ bottom: "20%", right: "20%", opacity: 0.3 }} />

            <div className="relative z-10 w-full max-w-md animate-slide-up">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <span className="text-5xl mb-4 block">🛡️</span>
                        <h1 className="text-3xl font-bold gradient-text-hero">AddictionTracker</h1>
                    </Link>
                    <p className="text-gray-500 mt-2 text-sm">Welcome back. Your journey continues.</p>
                </div>

                <div className="glass-card-dark p-8 border border-white/10">
                    <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field input-dark" placeholder="you@example.com" required autoComplete="email" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field input-dark" placeholder="••••••••" required autoComplete="current-password" />
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                            {loading ? (
                                <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</>
                            ) : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-gray-600">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <button onClick={handleGuestMode} disabled={guestLoading} className="mt-4 btn-secondary w-full py-3 text-sm">
                        {guestLoading ? "Loading..." : "👤 Continue as Guest"}
                    </button>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign Up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

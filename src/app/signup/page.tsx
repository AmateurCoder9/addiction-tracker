"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        const { error: authError } = await supabase.auth.signUp({ email, password });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
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
            <div className="glow-blue" style={{ top: "15%", right: "25%", opacity: 0.4 }} />
            <div className="glow-purple" style={{ bottom: "15%", left: "20%", opacity: 0.3 }} />

            <div className="relative z-10 w-full max-w-md animate-slide-up">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <span className="text-5xl mb-4 block">🛡️</span>
                        <h1 className="text-3xl font-bold gradient-text-hero">AddictionTracker</h1>
                    </Link>
                    <p className="text-gray-500 mt-2 text-sm">Start your recovery journey today.</p>
                </div>

                <div className="glass-card-dark p-8 border border-white/10">
                    {success ? (
                        <div className="text-center animate-fade-in">
                            <div className="text-5xl mb-4">✅</div>
                            <h2 className="text-xl font-semibold text-white mb-2">Check Your Email</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                We&apos;ve sent a confirmation link to <span className="text-emerald-400 font-medium">{email}</span>.
                            </p>
                            <Link href="/login" className="btn-primary inline-block">Go to Login</Link>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>

                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">{error}</div>
                            )}

                            <form onSubmit={handleSignup} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field input-dark" placeholder="you@example.com" required autoComplete="email" />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
                                    <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field input-dark" placeholder="Min 6 characters" required autoComplete="new-password" />
                                </div>
                                <div>
                                    <label htmlFor="confirm" className="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password</label>
                                    <input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field input-dark" placeholder="Repeat password" required autoComplete="new-password" />
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                                    {loading ? (<><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</>) : "Create Account"}
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
                                Already have an account?{" "}
                                <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Sign In</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

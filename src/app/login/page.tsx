"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword, signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const router = useRouter();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Login failed";
            setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
            setLoading(false);
        }
    }

    async function handleGuestMode() {
        setGuestLoading(true);
        setError(null);
        try {
            await signInAnonymously(auth);
            router.push("/dashboard");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Guest login failed";
            setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
            setGuestLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
            <div className="w-full max-w-sm animate-slide-up">
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-semibold text-white tracking-tight">AddictionTracker</h1>
                    <p className="text-neutral-600 mt-2 text-sm">Sign in to continue</p>
                </div>

                <div className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-neutral-500 mb-1.5">Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field input-dark" placeholder="you@example.com" required autoComplete="email" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-neutral-500 mb-1.5">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field input-dark" placeholder="••••••••" required autoComplete="current-password" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-white text-black py-2.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40">
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-neutral-800" />
                        <span className="text-xs text-neutral-700">or</span>
                        <div className="flex-1 h-px bg-neutral-800" />
                    </div>

                    <button onClick={handleGuestMode} disabled={guestLoading} className="w-full btn-outline py-2.5 text-sm">
                        {guestLoading ? "Loading..." : "Continue as guest"}
                    </button>

                    <p className="text-center text-sm text-neutral-600">
                        No account?{" "}
                        <Link href="/signup" className="text-neutral-400 hover:text-white transition-colors">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

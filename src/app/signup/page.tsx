"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirm) { setError("Passwords do not match"); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
        setError(null);
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Signup failed";
            setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-6">
            <div className="w-full max-w-sm animate-slide-up">
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-semibold text-white tracking-tight">AddictionTracker</h1>
                    <p className="text-neutral-600 mt-2 text-sm">Create your account</p>
                </div>

                <div className="space-y-5">
                    {error && (
                        <div className="p-3 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-neutral-500 mb-1.5">Email</label>
                            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field input-dark" placeholder="you@example.com" required autoComplete="email" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-neutral-500 mb-1.5">Password</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field input-dark" placeholder="••••••••" required autoComplete="new-password" />
                        </div>
                        <div>
                            <label htmlFor="confirm" className="block text-xs font-medium text-neutral-500 mb-1.5">Confirm password</label>
                            <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field input-dark" placeholder="••••••••" required autoComplete="new-password" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-white text-black py-2.5 rounded-md text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40">
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-neutral-600">
                        Already have an account?{" "}
                        <Link href="/login" className="text-neutral-400 hover:text-white transition-colors">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

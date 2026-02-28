"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Footer from "@/components/layout/Footer";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
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

        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Background gradient */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gray-950" />
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-gradient-to-t from-pink-600/15 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md animate-slide-up">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">🛡️</div>
                        <h1 className="text-3xl font-bold gradient-text">AddictionTracker</h1>
                        <p className="text-gray-400 mt-2 text-sm">
                            Start your recovery journey today.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="glass-card p-8">
                        {success ? (
                            <div className="text-center animate-fade-in">
                                <div className="text-5xl mb-4">✅</div>
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Check Your Email
                                </h2>
                                <p className="text-gray-400 text-sm mb-6">
                                    We&apos;ve sent a confirmation link to{" "}
                                    <span className="text-purple-400 font-medium">{email}</span>.
                                    Please verify your email to continue.
                                </p>
                                <button
                                    onClick={() => router.push("/login")}
                                    className="btn-primary"
                                >
                                    Go to Login
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold text-white mb-6">
                                    Create Account
                                </h2>

                                {error && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="input-field"
                                            placeholder="you@example.com"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="input-field"
                                            placeholder="Min 6 characters"
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-1.5">
                                            Confirm Password
                                        </label>
                                        <input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="input-field"
                                            placeholder="Repeat your password"
                                            required
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Creating account...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </button>
                                </form>

                                <p className="mt-6 text-center text-sm text-gray-400">
                                    Already have an account?{" "}
                                    <Link
                                        href="/login"
                                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

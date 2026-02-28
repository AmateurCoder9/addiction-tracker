"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useScrollRevealAll } from "@/hooks/useScrollReveal";

export default function LandingPage() {
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);
  useScrollRevealAll();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard");
    });
  }, [router]);

  async function handleGuestMode() {
    setGuestLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) {
      router.push("/dashboard");
      router.refresh();
    }
    setGuestLoading(false);
  }

  return (
    <div className="bg-black">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Glow effects */}
        <div className="glow-green" style={{ top: "20%", left: "30%", opacity: 0.7 }} />
        <div className="glow-blue" style={{ top: "40%", right: "20%", opacity: 0.5 }} />
        <div className="glow-purple" style={{ bottom: "20%", left: "50%", opacity: 0.4 }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="animate-slide-down">
            <span className="text-6xl mb-6 block animate-float">🛡️</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight leading-none animate-slide-up">
            <span className="gradient-text-hero">Take Control.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: "200ms" }}>
            Track your recovery journey. Celebrate every victory. One day at a time.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
            <Link href="/signup" className="btn-primary text-base px-8 py-4">
              Start Tracking Free
            </Link>
            <button onClick={handleGuestMode} disabled={guestLoading} className="btn-secondary text-base px-8 py-4">
              {guestLoading ? "Loading..." : "Continue as Guest"}
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-600 animate-slide-up" style={{ animationDelay: "600ms" }}>
            No credit card. No spam. Completely private.
          </p>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce-arrow">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ===== FEATURE 1: CALENDAR ===== */}
      <section className="relative min-h-screen flex items-center py-24 px-6 overflow-hidden" style={{ background: "linear-gradient(180deg, #000 0%, #021a0f 50%, #000 100%)" }}>
        <div className="glow-green" style={{ top: "10%", right: "10%", opacity: 0.5 }} />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal-left">
            <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase mb-4">Daily Tracking</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Every day<br /><span className="gradient-text-green">counts.</span>
            </h2>
            <p className="mt-6 text-gray-400 text-lg leading-relaxed max-w-md">
              Log your status with a single tap. See your progress laid out across a beautiful calendar. Green days add up fast.
            </p>
          </div>
          <div className="scroll-reveal-right">
            <div className="glass-card-dark p-8">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 28 }).map((_, i) => {
                  const statuses = ["clean", "clean", "clean", "clean", "clean", "relapse", "partial", "clean"];
                  const s = statuses[i % statuses.length];
                  const colors: Record<string, string> = {
                    clean: "bg-emerald-500/50 border-emerald-400/60",
                    relapse: "bg-red-500/40 border-red-400/50",
                    partial: "bg-amber-500/40 border-amber-400/50",
                  };
                  return (
                    <div key={i} className={`aspect-square rounded-md border ${colors[s]} flex items-center justify-center text-xs text-white/80 font-medium`}>
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 mt-6">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/50" /><span className="text-xs text-gray-500">Clean</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500/40" /><span className="text-xs text-gray-500">Relapse</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500/40" /><span className="text-xs text-gray-500">Partial</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE 2: STREAKS ===== */}
      <section className="relative min-h-screen flex items-center py-24 px-6 overflow-hidden bg-black">
        <div className="glow-blue" style={{ bottom: "20%", left: "15%", opacity: 0.6 }} />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal-right md:order-2">
            <p className="text-sky-400 text-sm font-semibold tracking-widest uppercase mb-4">Streaks & Milestones</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Watch it<br /><span className="gradient-text-blue">grow.</span>
            </h2>
            <p className="mt-6 text-gray-400 text-lg leading-relaxed max-w-md">
              Your streak is your superpower. Hit 7, 30, 100, or 365 days and get celebrated with confetti. Every clean day matters.
            </p>
          </div>
          <div className="scroll-reveal-left md:order-1">
            <div className="glass-card-dark p-8 text-center">
              <div className="text-6xl sm:text-7xl font-extrabold gradient-text-hero mb-2">23</div>
              <div className="text-gray-400 text-sm mb-6">day streak 🔥</div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">47</div>
                  <div className="text-xs text-gray-500">Clean Days</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">89%</div>
                  <div className="text-xs text-gray-500">Clean Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-rose-400">₹2,400</div>
                  <div className="text-xs text-gray-500">Saved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURE 3: STATS ===== */}
      <section className="relative min-h-screen flex items-center py-24 px-6 overflow-hidden" style={{ background: "linear-gradient(180deg, #000 0%, #0c0a1a 50%, #000 100%)" }}>
        <div className="glow-purple" style={{ top: "30%", right: "20%", opacity: 0.6 }} />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal-left">
            <p className="text-purple-400 text-sm font-semibold tracking-widest uppercase mb-4">Analytics</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              See your<br /><span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">progress.</span>
            </h2>
            <p className="mt-6 text-gray-400 text-lg leading-relaxed max-w-md">
              Beautiful charts, monthly breakdowns, and heatmaps that show how far you&apos;ve come. Track your spending too.
            </p>
          </div>
          <div className="scroll-reveal-right">
            <div className="glass-card-dark p-8">
              <div className="space-y-3">
                {[
                  { label: "Jan", clean: 85, color: "bg-emerald-500" },
                  { label: "Feb", clean: 72, color: "bg-emerald-500" },
                  { label: "Mar", clean: 91, color: "bg-emerald-500" },
                  { label: "Apr", clean: 68, color: "bg-emerald-500" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8">{m.label}</span>
                    <div className="flex-1 h-6 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${m.color}/40`} style={{ width: `${m.clean}%`, transition: "width 1.5s ease" }} />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{m.clean}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRIVACY ===== */}
      <section className="relative py-32 px-6 text-center bg-black overflow-hidden">
        <div className="glow-green" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.3 }} />
        <div className="relative z-10 scroll-reveal max-w-2xl mx-auto">
          <div className="text-5xl mb-6">🔒</div>
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
            Your data. <span className="text-gray-500">Nobody else&apos;s.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            End-to-end encrypted. No tracking. No ads. No selling your data. Your recovery journey is 100% private.
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-32 px-6 text-center overflow-hidden" style={{ background: "linear-gradient(135deg, #064e3b, #0c4a6e)" }}>
        <div className="relative z-10 scroll-reveal max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-4">
            Ready to start?
          </h2>
          <p className="text-emerald-200/70 text-lg mb-10">
            Join thousands taking control of their lives.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary text-base px-10 py-4">
              Create Free Account
            </Link>
            <button onClick={handleGuestMode} disabled={guestLoading} className="btn-secondary text-base px-10 py-4">
              {guestLoading ? "Loading..." : "Try as Guest"}
            </button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-black border-t border-white/5 py-8 px-6 text-center">
        <p className="text-sm text-gray-600">
          Made with ❤️ by{" "}
          <span className="gradient-text-green font-semibold">Vedant Kapadia</span>
        </p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <Link href="/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Sign In</Link>
          <span className="text-gray-700">•</span>
          <Link href="/signup" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
}

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
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-tight leading-[0.9] animate-slide-up">
            Take control.
          </h1>

          <p className="mt-8 text-lg text-neutral-500 max-w-md mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: "150ms" }}>
            Track your recovery. See your progress. One day at a time.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <Link href="/signup" className="btn-primary px-8 py-3 text-sm">
              Get started
            </Link>
            <button onClick={handleGuestMode} disabled={guestLoading} className="btn-outline px-8 py-3 text-sm">
              {guestLoading ? "Loading..." : "Continue as guest"}
            </button>
          </div>

          <p className="mt-8 text-xs text-neutral-600 animate-slide-up" style={{ animationDelay: "450ms" }}>
            Free. Private. No account required.
          </p>
        </div>

        <div className="absolute bottom-12 animate-bounce-arrow">
          <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7" />
          </svg>
        </div>
      </section>

      {/* Feature 1 */}
      <section className="min-h-screen flex items-center py-24 px-6 border-t border-neutral-900">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal-left">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 mb-4">Daily Tracking</p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Every day counts.
            </h2>
            <p className="mt-6 text-neutral-500 leading-relaxed">
              Log your status with a single tap. See your progress across a clean calendar. Build momentum with every clean day.
            </p>
          </div>
          <div className="scroll-reveal-right">
            <div className="card-dark p-6">
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: 28 }).map((_, i) => {
                  const statuses = ["clean", "clean", "clean", "clean", "clean", "relapse", "partial", "clean"];
                  const s = statuses[i % statuses.length];
                  const bg = s === "clean" ? "bg-neutral-700" : s === "relapse" ? "bg-white" : "bg-neutral-500";
                  return (
                    <div key={i} className={`aspect-square rounded ${bg} flex items-center justify-center text-[0.6rem] ${s === "relapse" ? "text-black" : "text-neutral-300"} font-medium`}>
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2 */}
      <section className="min-h-screen flex items-center py-24 px-6 border-t border-neutral-900">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal-right md:order-2">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 mb-4">Streaks</p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              Watch it grow.
            </h2>
            <p className="mt-6 text-neutral-500 leading-relaxed">
              Your streak is your progress made visible. Track consecutive clean days and celebrate milestones at 7, 30, 100, and 365 days.
            </p>
          </div>
          <div className="scroll-reveal-left md:order-1">
            <div className="card-dark p-8 text-center">
              <div className="text-6xl font-light tracking-tight text-white mb-1">23</div>
              <div className="text-sm text-neutral-500 mb-8">day streak</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-medium text-white">47</div>
                  <div className="text-xs text-neutral-600 mt-0.5">Clean</div>
                </div>
                <div>
                  <div className="text-xl font-medium text-white">89%</div>
                  <div className="text-xs text-neutral-600 mt-0.5">Rate</div>
                </div>
                <div>
                  <div className="text-xl font-medium text-white">2,400</div>
                  <div className="text-xs text-neutral-600 mt-0.5">Saved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3 */}
      <section className="min-h-screen flex items-center py-24 px-6 border-t border-neutral-900">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="scroll-reveal-left">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-neutral-500 mb-4">Analytics</p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight">
              See your progress.
            </h2>
            <p className="mt-6 text-neutral-500 leading-relaxed">
              Charts, monthly breakdowns, and heatmaps that show how far you have come. Track your spending.
            </p>
          </div>
          <div className="scroll-reveal-right">
            <div className="card-dark p-6">
              <div className="space-y-3">
                {[
                  { label: "Jan", value: 85 },
                  { label: "Feb", value: 72 },
                  { label: "Mar", value: 91 },
                  { label: "Apr", value: 68 },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-600 w-8 font-mono">{m.label}</span>
                    <div className="flex-1 h-5 rounded bg-neutral-900 overflow-hidden">
                      <div className="h-full rounded bg-neutral-600" style={{ width: `${m.value}%` }} />
                    </div>
                    <span className="text-xs text-neutral-500 w-8 text-right font-mono">{m.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-32 px-6 text-center border-t border-neutral-900">
        <div className="scroll-reveal max-w-lg mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Your data. <span className="text-neutral-600">Nobody else&apos;s.</span>
          </h2>
          <p className="mt-4 text-neutral-500 leading-relaxed">
            Encrypted. No tracking. No ads. Your journey is completely private.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center border-t border-neutral-900 bg-neutral-950">
        <div className="scroll-reveal max-w-lg mx-auto">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Ready?
          </h2>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary px-10 py-3">
              Create account
            </Link>
            <button onClick={handleGuestMode} disabled={guestLoading} className="btn-outline px-10 py-3">
              {guestLoading ? "Loading..." : "Try as guest"}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 px-6 text-center">
        <p className="text-xs text-neutral-700">
          Built by Vedant Kapadia
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link href="/login" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Sign in</Link>
          <span className="text-neutral-800">·</span>
          <Link href="/signup" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}

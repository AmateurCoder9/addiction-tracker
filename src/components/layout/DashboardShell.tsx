"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { ReactNode } from "react";

export default function DashboardShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Background gradient */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-cyan-50/30 to-sky-50" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/20 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-sky-200/15 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            <Navbar />
            <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            <Footer />
        </div>
    );
}

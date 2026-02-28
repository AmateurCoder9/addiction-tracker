"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import type { ReactNode } from "react";

export default function DashboardShell({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#fafafa]">
            <Navbar />
            <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
            <Footer />
        </div>
    );
}

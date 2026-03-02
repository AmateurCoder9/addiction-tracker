"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      router.push(user ? "/dashboard" : "/login");
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-5 h-5 border border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
    </div>
  );
}

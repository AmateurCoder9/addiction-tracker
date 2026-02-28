"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      router.push(user ? "/dashboard" : "/login");
    }).catch(() => {
      router.push("/login");
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-5 h-5 border border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
    </div>
  );
}

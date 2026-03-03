"use client";

export default function LoadingSpinner({ message }: { message?: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-5 h-5 border border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
            {message && <p className="mt-4 text-xs text-neutral-400">{message}</p>}
        </div>
    );
}

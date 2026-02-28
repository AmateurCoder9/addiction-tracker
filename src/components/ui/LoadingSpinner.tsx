"use client";

export default function LoadingSpinner({ message }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-200" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
            </div>
            {message && (
                <p className="mt-4 text-sm text-gray-500">{message}</p>
            )}
        </div>
    );
}

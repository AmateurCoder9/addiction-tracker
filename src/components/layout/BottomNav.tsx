"use client";

interface BottomNavProps {
    activeSection: string;
    onNavigate: (section: string) => void;
}

const tabs = [
    { id: "today", label: "Today" },
    { id: "trackers", label: "Trackers" },
    { id: "calendar", label: "Calendar" },
    { id: "stats", label: "Stats" },
];

export default function BottomNav({ activeSection, onNavigate }: BottomNavProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-90 bg-black/90 backdrop-blur-md border-t border-neutral-900 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="flex items-center justify-around py-2.5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onNavigate(tab.id)}
                        className={`text-xs font-medium py-1 px-3 rounded transition-colors ${activeSection === tab.id ? "text-white" : "text-neutral-600"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

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
        <div className="bottom-nav md:hidden">
            <div className="flex items-center justify-around py-2.5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onNavigate(tab.id)}
                        className={`text-xs font-medium py-1 px-3 rounded transition-colors ${activeSection === tab.id
                                ? "text-neutral-900"
                                : "text-neutral-400"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

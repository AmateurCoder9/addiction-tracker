"use client";

interface BottomNavProps {
    activeSection: string;
    onNavigate: (section: string) => void;
}

const tabs = [
    { id: "today", label: "Today", icon: "⚡" },
    { id: "trackers", label: "Trackers", icon: "🎯" },
    { id: "calendar", label: "Calendar", icon: "📅" },
    { id: "stats", label: "Stats", icon: "📊" },
];

export default function BottomNav({ activeSection, onNavigate }: BottomNavProps) {
    return (
        <div className="bottom-nav md:hidden">
            <div className="flex items-center justify-around py-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onNavigate(tab.id)}
                        className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl transition-all ${activeSection === tab.id
                                ? "text-emerald-600"
                                : "text-gray-400"
                            }`}
                    >
                        <span className="text-xl">{tab.icon}</span>
                        <span className="text-[0.6rem] font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

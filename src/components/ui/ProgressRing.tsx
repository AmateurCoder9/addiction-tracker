"use client";

interface ProgressRingProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    children?: React.ReactNode;
}

export default function ProgressRing({
    percentage,
    size = 80,
    strokeWidth = 6,
    color = "#10b981",
    bgColor = "rgba(0,0,0,0.04)",
    children,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="progress-ring-circle"
                    style={
                        {
                            "--circumference": circumference,
                            "--offset": offset,
                        } as React.CSSProperties
                    }
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}

"use client";

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell,
} from "recharts";
import type { MonthlySummary } from "@/lib/types";

interface StatsChartsProps {
    monthlySummary: MonthlySummary[];
    addictionName: string;
}

const COLORS = {
    clean: "#10b981",
    relapse: "#ef4444",
    partial: "#f59e0b",
};

export default function StatsCharts({ monthlySummary, addictionName }: StatsChartsProps) {
    const totalClean = monthlySummary.reduce((acc, m) => acc + m.clean, 0);
    const totalRelapse = monthlySummary.reduce((acc, m) => acc + m.relapse, 0);
    const totalPartial = monthlySummary.reduce((acc, m) => acc + m.partial, 0);

    const pieData = [
        { name: "Clean", value: totalClean, color: COLORS.clean },
        { name: "Relapse", value: totalRelapse, color: COLORS.relapse },
        { name: "Partial", value: totalPartial, color: COLORS.partial },
    ].filter((d) => d.value > 0);

    const barData = monthlySummary.map((m) => ({
        name: `${m.month} ${m.year}`,
        Clean: m.clean,
        Relapse: m.relapse,
        Partial: m.partial,
    }));

    return (
        <div className="space-y-6">
            <div className="glass-card p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📊</span> Monthly Breakdown — {addictionName}
                </h3>
                <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={{ stroke: "rgba(0,0,0,0.1)" }} />
                            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={{ stroke: "rgba(0,0,0,0.1)" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "0.75rem", fontSize: "0.75rem" }} />
                            <Bar dataKey="Clean" fill={COLORS.clean} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Relapse" fill={COLORS.relapse} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Partial" fill={COLORS.partial} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="glass-card p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>🥧</span> Overall Distribution
                </h3>
                <div className="h-64 flex items-center justify-center">
                    {pieData.length > 0 ? (
                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                            <div className="w-48 h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                            {pieData.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "0.75rem", fontSize: "0.75rem" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-3">
                                {pieData.map((entry) => (
                                    <div key={entry.name} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-sm" style={{ background: entry.color }} />
                                        <span className="text-sm text-gray-600">{entry.name}: <span className="font-semibold text-gray-800">{entry.value}</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">No data available</p>
                    )}
                </div>
            </div>
        </div>
    );
}

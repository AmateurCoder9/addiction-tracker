"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { MonthlySummary } from "@/lib/types";

interface StatsChartsProps {
    monthlySummary: MonthlySummary[];
    addictionName: string;
}

const COLORS = { clean: "#737373", relapse: "#e5e5e5", partial: "#404040" };

export default function StatsCharts({ monthlySummary, addictionName }: StatsChartsProps) {
    const totalClean = monthlySummary.reduce((a, m) => a + m.clean, 0);
    const totalRelapse = monthlySummary.reduce((a, m) => a + m.relapse, 0);
    const totalPartial = monthlySummary.reduce((a, m) => a + m.partial, 0);

    const pieData = [
        { name: "Clean", value: totalClean, color: COLORS.clean },
        { name: "Relapse", value: totalRelapse, color: COLORS.relapse },
        { name: "Partial", value: totalPartial, color: COLORS.partial },
    ].filter((d) => d.value > 0);

    const barData = monthlySummary.map((m) => ({ name: `${m.month}`, Clean: m.clean, Relapse: m.relapse, Partial: m.partial }));

    return (
        <div className="space-y-4">
            <div className="p-6 rounded-lg bg-neutral-950 border border-neutral-800">
                <h3 className="text-sm font-medium text-neutral-300 mb-4">Monthly — {addictionName}</h3>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                            <XAxis dataKey="name" tick={{ fill: "#525252", fontSize: 11 }} axisLine={{ stroke: "#262626" }} />
                            <YAxis tick={{ fill: "#525252", fontSize: 11 }} axisLine={{ stroke: "#262626" }} allowDecimals={false} />
                            <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#a3a3a3" }} />
                            <Bar dataKey="Clean" fill={COLORS.clean} radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Relapse" fill={COLORS.relapse} radius={[2, 2, 0, 0]} />
                            <Bar dataKey="Partial" fill={COLORS.partial} radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="p-6 rounded-lg bg-neutral-950 border border-neutral-800">
                <h3 className="text-sm font-medium text-neutral-300 mb-4">Distribution</h3>
                <div className="h-48 flex items-center justify-center">
                    {pieData.length > 0 ? (
                        <div className="flex items-center gap-8">
                            <div className="w-36 h-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={2} dataKey="value">
                                            {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: "0.5rem", fontSize: "0.75rem", color: "#a3a3a3" }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {pieData.map((e) => (
                                    <div key={e.name} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
                                        <span className="text-xs text-neutral-500">{e.name}: <span className="text-neutral-300 font-medium">{e.value}</span></span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : <p className="text-xs text-neutral-600">No data</p>}
                </div>
            </div>
        </div>
    );
}

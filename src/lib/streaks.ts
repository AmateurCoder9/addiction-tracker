import type { Log, StreakData, MonthlySummary } from "./types";
import { format, parseISO, differenceInDays, startOfDay } from "date-fns";

export function calculateStreaks(logs: Log[]): StreakData {
    if (logs.length === 0) {
        return { currentStreak: 0, longestStreak: 0, totalRelapses: 0, totalClean: 0, totalPartial: 0, totalLogs: 0, cleanPercentage: 0, relapsePercentage: 0, totalCost: 0, monthlySummary: [] };
    }

    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalRelapses = sorted.filter((l) => l.status === "relapse").length;
    const totalClean = sorted.filter((l) => l.status === "clean").length;
    const totalPartial = sorted.filter((l) => l.status === "partial").length;
    const totalLogs = sorted.length;
    const totalCost = sorted.reduce((acc, l) => acc + (Number(l.cost) || 0), 0);
    const cleanPercentage = totalLogs > 0 ? Math.round((totalClean / totalLogs) * 100) : 0;
    const relapsePercentage = totalLogs > 0 ? Math.round((totalRelapses / totalLogs) * 100) : 0;

    let currentStreak = 0;
    const today = startOfDay(new Date());
    const reversed = [...sorted].reverse();

    for (const log of reversed) {
        const logDate = startOfDay(parseISO(log.date));
        const daysDiff = differenceInDays(today, logDate);
        if (log.status === "clean") {
            if (daysDiff === currentStreak || daysDiff === currentStreak + 1) { currentStreak++; }
            else if (currentStreak === 0 && daysDiff <= 1) { currentStreak = 1; }
            else { break; }
        } else { break; }
    }

    let longestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].status === "clean") {
            tempStreak++;
            if (i > 0) {
                const prevDate = startOfDay(parseISO(sorted[i - 1].date));
                const currDate = startOfDay(parseISO(sorted[i].date));
                if (differenceInDays(currDate, prevDate) > 1 || sorted[i - 1].status !== "clean") { tempStreak = 1; }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        } else { tempStreak = 0; }
    }

    const monthlyMap = new Map<string, MonthlySummary>();
    for (const log of sorted) {
        const date = parseISO(log.date);
        const key = format(date, "yyyy-MM");
        if (!monthlyMap.has(key)) {
            monthlyMap.set(key, { month: format(date, "MMM"), year: date.getFullYear(), clean: 0, relapse: 0, partial: 0, total: 0, cost: 0 });
        }
        const entry = monthlyMap.get(key)!;
        entry.total++;
        entry.cost += Number(log.cost) || 0;
        if (log.status === "clean") entry.clean++;
        else if (log.status === "relapse") entry.relapse++;
        else if (log.status === "partial") entry.partial++;
    }

    return { currentStreak, longestStreak, totalRelapses, totalClean, totalPartial, totalLogs, cleanPercentage, relapsePercentage, totalCost, monthlySummary: Array.from(monthlyMap.values()) };
}

export function isMilestoneStreak(streak: number): boolean {
    return streak === 7 || streak === 30 || streak === 100 || streak === 365;
}

export function getMilestoneMessage(streak: number): string {
    switch (streak) {
        case 7: return "One week strong. You are building momentum.";
        case 30: return "30 days. A full month of progress.";
        case 100: return "100 days. Truly inspiring.";
        case 365: return "One year. Unstoppable.";
        default: return "";
    }
}

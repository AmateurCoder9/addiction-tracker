import type { Log, StreakData, MonthlySummary } from "./types";
import { format, parseISO, differenceInDays, startOfDay } from "date-fns";

export function calculateStreaks(logs: Log[]): StreakData {
    if (logs.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            totalRelapses: 0,
            totalClean: 0,
            totalPartial: 0,
            totalLogs: 0,
            cleanPercentage: 0,
            relapsePercentage: 0,
            monthlySummary: [],
        };
    }

    const sorted = [...logs].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalRelapses = sorted.filter((l) => l.status === "relapse").length;
    const totalClean = sorted.filter((l) => l.status === "clean").length;
    const totalPartial = sorted.filter((l) => l.status === "partial").length;
    const totalLogs = sorted.length;

    const cleanPercentage = totalLogs > 0 ? Math.round((totalClean / totalLogs) * 100) : 0;
    const relapsePercentage = totalLogs > 0 ? Math.round((totalRelapses / totalLogs) * 100) : 0;

    // Calculate current streak (consecutive clean days from most recent)
    let currentStreak = 0;
    const today = startOfDay(new Date());
    const reversed = [...sorted].reverse();

    for (const log of reversed) {
        const logDate = startOfDay(parseISO(log.date));
        const daysDiff = differenceInDays(today, logDate);

        if (log.status === "clean") {
            if (daysDiff === currentStreak || daysDiff === currentStreak + 1) {
                currentStreak++;
            } else if (currentStreak === 0 && daysDiff <= 1) {
                currentStreak = 1;
            } else {
                break;
            }
        } else {
            break;
        }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].status === "clean") {
            tempStreak++;

            if (i > 0) {
                const prevDate = startOfDay(parseISO(sorted[i - 1].date));
                const currDate = startOfDay(parseISO(sorted[i].date));
                const gap = differenceInDays(currDate, prevDate);

                if (gap > 1 || sorted[i - 1].status !== "clean") {
                    tempStreak = 1;
                }
            }

            longestStreak = Math.max(longestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    }

    // Monthly summary
    const monthlyMap = new Map<string, MonthlySummary>();

    for (const log of sorted) {
        const date = parseISO(log.date);
        const key = format(date, "yyyy-MM");
        const monthName = format(date, "MMM");
        const year = date.getFullYear();

        if (!monthlyMap.has(key)) {
            monthlyMap.set(key, {
                month: monthName,
                year,
                clean: 0,
                relapse: 0,
                partial: 0,
                total: 0,
            });
        }

        const entry = monthlyMap.get(key)!;
        entry.total++;
        if (log.status === "clean") entry.clean++;
        else if (log.status === "relapse") entry.relapse++;
        else if (log.status === "partial") entry.partial++;
    }

    const monthlySummary = Array.from(monthlyMap.values());

    return {
        currentStreak,
        longestStreak,
        totalRelapses,
        totalClean,
        totalPartial,
        totalLogs,
        cleanPercentage,
        relapsePercentage,
        monthlySummary,
    };
}

export function isMilestoneStreak(streak: number): boolean {
    return streak === 7 || streak === 30 || streak === 100 || streak === 365;
}

export function getMilestoneMessage(streak: number): string {
    switch (streak) {
        case 7:
            return "🎉 One week strong! You're building momentum!";
        case 30:
            return "🏆 30 days! A full month of progress!";
        case 100:
            return "💎 100 days! You're truly inspiring!";
        case 365:
            return "👑 One year! You are unstoppable!";
        default:
            return "";
    }
}

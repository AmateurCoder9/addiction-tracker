export interface Addiction {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Log {
  id: string;
  user_id: string;
  addiction_id: string;
  date: string;
  status: "clean" | "relapse" | "partial";
  note: string | null;
  created_at: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalRelapses: number;
  totalClean: number;
  totalPartial: number;
  totalLogs: number;
  cleanPercentage: number;
  relapsePercentage: number;
  monthlySummary: MonthlySummary[];
}

export interface MonthlySummary {
  month: string;
  year: number;
  clean: number;
  relapse: number;
  partial: number;
  total: number;
}

export interface DayLog {
  date: string;
  status: "clean" | "relapse" | "partial";
  note: string | null;
}

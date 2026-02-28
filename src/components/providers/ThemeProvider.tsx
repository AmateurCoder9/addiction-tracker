"use client";

import {
    createContext,
    useContext,
    useSyncExternalStore,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    toggleTheme: () => { },
});

function getStoredTheme(): Theme {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme") as Theme) || "dark";
}

let currentTheme: Theme = "dark";
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
    return currentTheme;
}

function getServerSnapshot(): Theme {
    return "dark";
}

function setThemeExternal(newTheme: Theme) {
    currentTheme = newTheme;
    if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
    }
    listeners.forEach((l) => l());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
        const stored = getStoredTheme();
        setThemeExternal(stored);
    }, []);

    const toggleTheme = useCallback(() => {
        const next = currentTheme === "dark" ? "light" : "dark";
        setThemeExternal(next);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { syncRates } from "@/lib/expense-calculator";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState("glassmorphic");

    useEffect(() => {
        const updateTheme = () => {
            const current = localStorage.getItem("app_theme") || "glassmorphic";
            setTheme(current);
            if (current === "dark") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        };
        updateTheme();
        syncRates();

        // Listen for cross-tab or manually dispatched storage events from Settings
        window.addEventListener("storage", updateTheme);
        return () => window.removeEventListener("storage", updateTheme);
    }, []);

    const bgImage = theme === "dark"
        ? "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80" // Authentic Milky Way Galaxy photo
        : "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1920&auto=format&fit=crop";

    // Secondary fallback for a really moody ultra-dark aesthetic
    const actualBackgroundImage = theme === "dark" ? "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80" : bgImage;

    return (
        <>
            <div className="fixed inset-0 z-[-1] bg-black">
                <img
                    key={actualBackgroundImage}
                    src={actualBackgroundImage}
                    alt="Theme Background"
                    className="w-full h-full object-cover transition-opacity duration-1000 animate-in fade-in"
                    style={{ opacity: theme === "dark" ? 0.7 : 1 }}
                />
            </div>
            {children}
        </>
    );
}

/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Compass, Settings, Cloud, CloudDrizzle, CloudLightning, CloudRain, CloudSnow, Sun, Moon, CloudFog } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function TopBar() {
    const [mounted, setMounted] = useState(false);
    const [weather, setWeather] = useState<{ temp: number, code: number } | null>(null);
    const [destinationName, setDestinationName] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editLocation, setEditLocation] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsDarkMode(document.documentElement.classList.contains("dark") || localStorage.getItem("app_theme") === "dark");

        const handleStorage = () => setIsDarkMode(document.documentElement.classList.contains("dark"));
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        localStorage.setItem("app_theme", newTheme);
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
            setIsDarkMode(true);
        } else {
            document.documentElement.classList.remove("dark");
            setIsDarkMode(false);
        }
        window.dispatchEvent(new Event("storage"));
    };

    const fetchWeatherForLocation = async (lat: number, lng: number, city: string) => {
        try {
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`);
            const wData = await wRes.json();
            if (wData.current) {
                setWeather({ temp: wData.current.temperature_2m, code: wData.current.weather_code });
                setDestinationName(city);
            }
        } catch (err) { console.error(err); }
    };

    const submitLocation = async (loc: string) => {
        setIsEditing(false);
        if (!loc.trim()) {
            localStorage.removeItem("custom_weather_location");
            fetchWeather();
            window.dispatchEvent(new Event("weather_location_updated"));
            return;
        }
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
                const { latitude, longitude, name } = geoData.results[0];
                localStorage.setItem("custom_weather_location", JSON.stringify({ latitude, longitude, name }));
                fetchWeatherForLocation(latitude, longitude, name);
                window.dispatchEvent(new Event("weather_location_updated"));
            } else {
                alert("Weather data not found for this location.");
            }
        } catch (err) {
            console.error("Geocoding failed", err);
        }
    };

    async function fetchWeather() {
        try {
            const cache = localStorage.getItem("custom_weather_location");
            if (cache) {
                const { latitude, longitude, name } = JSON.parse(cache);
                await fetchWeatherForLocation(latitude, longitude, name);
                return;
            }

            const geoRes = await fetch('https://ipwho.is/');
            const geoData = await geoRes.json();

            if (!geoData.success) return;

            const { latitude, longitude, city } = geoData;
            await fetchWeatherForLocation(latitude, longitude, city);
        } catch (err) {
            console.error("Failed to fetch weather", err);
        }
    }

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);

        const handleUpdate = () => fetchWeather();
        window.addEventListener("weather_location_updated", handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener("weather_location_updated", handleUpdate);
        };
    }, []);

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="w-5 h-5 text-yellow-400 drop-shadow-sm" />;
        if (code <= 3) return <Cloud className="w-5 h-5 text-slate-200 drop-shadow-sm" />;
        if (code === 45 || code === 48) return <CloudFog className="w-5 h-5 text-slate-300 drop-shadow-sm" />;
        if (code >= 51 && code <= 55) return <CloudDrizzle className="w-5 h-5 text-blue-300 drop-shadow-sm" />;
        if (code >= 61 && code <= 65) return <CloudRain className="w-5 h-5 text-blue-400 drop-shadow-sm" />;
        if (code >= 71 && code <= 77) return <CloudSnow className="w-5 h-5 text-indigo-100 drop-shadow-sm" />;
        if (code >= 80 && code <= 82) return <CloudRain className="w-5 h-5 text-blue-500 drop-shadow-sm" />;
        if (code >= 95) return <CloudLightning className="w-5 h-5 text-purple-400 drop-shadow-sm" />;
        return <Sun className="w-5 h-5 text-yellow-500" />;
    };

    if (!mounted) {
        return (
            <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-background/80 backdrop-blur-md border-b border-border relative">
                <Link href="/" className="flex items-center space-x-2">
                    <Compass className="w-6 h-6 text-primary" />
                    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                        WanderLog
                    </span>
                </Link>
                <div className="flex items-center space-x-3">
                    <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary relative z-10">
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <Link href="/settings" className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary block relative z-10">
                        <Settings className="w-5 h-5" />
                    </Link>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-4 bg-background/80 backdrop-blur-md border-b border-border relative">
            <Link href="/" className="flex items-center space-x-2">
                <Compass className="w-6 h-6 text-primary" />
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                    WanderLog
                </span>
            </Link>

            <div className="flex items-center space-x-3">
                <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary relative z-10">
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <Link href="/settings" className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary block relative z-10">
                    <Settings className="w-5 h-5" />
                </Link>
            </div>

            {weather && destinationName && (
                <div className="absolute top-[3.5rem] right-4 bg-card/60 backdrop-blur-xl rounded-xl border border-border shadow-lg p-2.5 min-w-[130px] w-max flex items-center justify-between space-x-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col">
                        {isEditing ? (
                            <input
                                autoFocus
                                className="text-[10px] bg-transparent border-b border-muted-foreground outline-none uppercase tracking-wider text-foreground leading-tight w-20"
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                onBlur={() => submitLocation(editLocation)}
                                onKeyDown={(e) => e.key === 'Enter' && submitLocation(editLocation)}
                            />
                        ) : (
                            <span
                                onClick={() => { setIsEditing(true); setEditLocation(destinationName); }}
                                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight hover:text-foreground cursor-pointer transition-colors"
                                title="Click to change location"
                            >
                                {destinationName}
                            </span>
                        )}
                        <span className="text-lg font-black font-sans leading-tight text-foreground">{weather.temp}°C</span>
                    </div>
                    <div className="bg-background/40 p-2 rounded-full shadow-inner pointer-events-none">
                        {getWeatherIcon(weather.code)}
                    </div>
                </div>
            )}
        </header>
    );
}

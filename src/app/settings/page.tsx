/* eslint-disable */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Moon, Sun, Monitor, Type, DollarSign, Bell, Palette, MapPin, User, Mail, LogOut, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const [theme, setTheme] = useState("glassmorphic");
    const [currency, setCurrency] = useState("USD");
    const [distanceUnit, setDistanceUnit] = useState("km");
    const [weatherLocation, setWeatherLocation] = useState("");
    const [weatherTemp, setWeatherTemp] = useState<number | null>(null);
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editProfileForm, setEditProfileForm] = useState({ name: "", email: "" });

    const fetchTempForCoords = async (lat: number, lng: number) => {
        try {
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m`);
            const wData = await wRes.json();
            if (wData.current && wData.current.temperature_2m !== undefined) {
                setWeatherTemp(wData.current.temperature_2m);
                return wData.current.temperature_2m;
            }
        } catch (e) { }
        return null;
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            setTheme(localStorage.getItem("app_theme") || "glassmorphic");
            setCurrency(localStorage.getItem("app_currency") || "USD");
            setDistanceUnit(localStorage.getItem("app_distance") || "km");

            const loadCachedWeather = async () => {
                const cachedWeather = localStorage.getItem("custom_weather_location");
                if (cachedWeather) {
                    try {
                        const parsed = JSON.parse(cachedWeather);
                        if (parsed.name) setWeatherLocation(parsed.name);
                        if (parsed.latitude && parsed.longitude) {
                            await fetchTempForCoords(parsed.latitude, parsed.longitude);
                        }
                    } catch (e) {
                        console.error("Failed to parse cached weather", e);
                    }
                }
            };
            loadCachedWeather();

            const fetchUser = async () => {
                const token = localStorage.getItem("token");
                if (!token) return;
                try {
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                    const res = await fetch(`${API_URL}/api/auth/me`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                        setEditProfileForm({ name: data.user.name || "", email: data.user.email });
                    }
                } catch (e) {
                    console.error("Error fetching user", e);
                }
            };
            fetchUser();
        }
    }, []);

    const handleSaveTheme = (newTheme: string) => {
        setTheme(newTheme);
        localStorage.setItem("app_theme", newTheme);
    };

    const handleSaveCurrency = (newCurr: string) => {
        setCurrency(newCurr);
        localStorage.setItem("app_currency", newCurr);
    };

    const handleSaveDistance = (newDist: string) => {
        setDistanceUnit(newDist);
        localStorage.setItem("app_distance", newDist);
    };

    const handleSaveWeatherLocation = async () => {
        if (!weatherLocation.trim()) {
            localStorage.removeItem("custom_weather_location");
            alert("Weather location reset to automatically detect.");
            window.dispatchEvent(new Event("weather_location_updated"));
            return;
        }
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherLocation)}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
                const { latitude, longitude, name } = geoData.results[0];
                localStorage.setItem("custom_weather_location", JSON.stringify({ latitude, longitude, name }));
                setWeatherLocation(name);
                const temp = await fetchTempForCoords(latitude, longitude);
                if (temp !== null) {
                    alert(`Weather location updated to ${name}. Current temperature is ${temp}°C.`);
                } else {
                    alert(`Weather location updated to ${name}.`);
                }
                window.dispatchEvent(new Event("weather_location_updated"));
            } else {
                alert("Weather data not found for this location.");
            }
        } catch (err) {
            console.error("Geocoding failed", err);
            alert("Failed to fetch location data.");
        }
    };

    const handleSaveProfile = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const res = await fetch(`${API_URL}/api/auth/me`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editProfileForm)
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setIsEditingProfile(false);
            } else {
                alert("Failed to update profile");
            }
        } catch (e) {
            alert("Error updating profile");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/");
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-50 flex items-center h-14 px-4 bg-background/80 backdrop-blur-md border-b border-border">
                <button onClick={() => router.back()} className="mr-4 p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                </button>
                <h1 className="font-bold text-xl text-foreground">Settings</h1>
            </header>

            <main className="max-w-3xl mx-auto p-4 space-y-8 mt-4">
                {/* Account Settings */}
                {user && (
                    <section className="space-y-4">
                        <h2 className="text-sm font-semibold text-primary uppercase tracking-wider px-2">Account</h2>
                        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-6 relative">
                            {isEditingProfile ? (
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <User className="w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={editProfileForm.name}
                                            onChange={e => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                                            className="bg-secondary text-foreground text-sm font-medium px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/50 flex-1"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Mail className="w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="email"
                                            value={editProfileForm.email}
                                            onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                                            className="bg-secondary text-foreground text-sm font-medium px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/50 flex-1"
                                            placeholder="Your Email"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2 pt-2">
                                        <button onClick={() => setIsEditingProfile(false)} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm font-medium transition-colors flex items-center space-x-1">
                                            <X className="w-4 h-4" /> <span>Cancel</span>
                                        </button>
                                        <button onClick={handleSaveProfile} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors flex items-center space-x-1 shadow-sm">
                                            <Check className="w-4 h-4" /> <span>Save</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-14 h-14 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-xl uppercase">
                                            {user.name ? user.name.substring(0, 2) : user.email.substring(0, 2)}
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="font-bold text-lg text-foreground leading-tight">{user.name || "Traveller"}</h3>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2">
                                        <button onClick={() => setIsEditingProfile(true)} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors border border-border">
                                            Edit Profile
                                        </button>
                                        <button onClick={handleLogout} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition-colors flex items-center space-x-1 border border-red-500/20 justify-center">
                                            <LogOut className="w-3.5 h-3.5" /> <span>Log Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Appearance Settings */}
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider px-2">Appearance</h2>

                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="p-4 flex flex-col space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <Palette className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-foreground">App Theme</h3>
                                        <p className="text-xs text-muted-foreground">Choose your visual style</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 pt-2">
                                <button
                                    onClick={() => handleSaveTheme("light")}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                                >
                                    <Sun className={`w-6 h-6 mb-2 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
                                    <span className={`text-xs font-medium ${theme === "light" ? "text-primary" : "text-muted-foreground"}`}>Light</span>
                                </button>
                                <button
                                    onClick={() => handleSaveTheme("dark")}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                                >
                                    <Moon className={`w-6 h-6 mb-2 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
                                    <span className={`text-xs font-medium ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`}>Dark</span>
                                </button>
                                <button
                                    onClick={() => handleSaveTheme("glassmorphic")}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${theme === "glassmorphic" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                                >
                                    <Monitor className={`w-6 h-6 mb-2 ${theme === "glassmorphic" ? "text-primary" : "text-muted-foreground"}`} />
                                    <span className={`text-xs font-medium ${theme === "glassmorphic" ? "text-primary" : "text-muted-foreground"}`}>System</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Localization Settings */}
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider px-2">Localization</h2>
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden divide-y divide-border">
                        {/* Currency */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Base Currency</h3>
                                    <p className="text-xs text-muted-foreground">Default for expenses</p>
                                </div>
                            </div>
                            <select
                                value={currency}
                                onChange={(e) => handleSaveCurrency(e.target.value)}
                                className="bg-secondary text-foreground text-sm font-medium px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="JPY">JPY (¥)</option>
                            </select>
                        </div>

                        {/* Distance */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <Type className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Distance Units</h3>
                                    <p className="text-xs text-muted-foreground">For route lengths</p>
                                </div>
                            </div>
                            <div className="flex bg-secondary p-1 rounded-lg border border-border">
                                <button
                                    onClick={() => handleSaveDistance("km")}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${distanceUnit === "km" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    KM
                                </button>
                                <button
                                    onClick={() => handleSaveDistance("mi")}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${distanceUnit === "mi" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    Miles
                                </button>
                            </div>
                        </div>

                        {/* Weather Location Overlay */}
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">
                                        Weather Location {weatherTemp !== null && <span className="text-primary ml-2">• {weatherTemp}°C</span>}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">Override auto-detected city</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={weatherLocation}
                                    onChange={(e) => setWeatherLocation(e.target.value)}
                                    placeholder="Auto-detect"
                                    className="bg-secondary text-foreground text-sm font-medium px-4 py-2 rounded-lg border border-border outline-none focus:ring-2 focus:ring-primary/50 flex-1 max-w-[150px]"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveWeatherLocation()}
                                />
                                <button
                                    onClick={handleSaveWeatherLocation}
                                    className="px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-primary uppercase tracking-wider px-2">Notifications</h2>
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-foreground">Trip Reminders</h3>
                                    <p className="text-xs text-muted-foreground">Push notifications for upcoming trips</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

/* eslint-disable */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Mail, Lock, User, ArrowRight, Loader2, Sun, Moon } from "lucide-react";

export function SignIn({ onSuccess }: { onSuccess: (token: string, user: Record<string, unknown>) => void }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

        try {
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(isLogin ? { email, password } : { email, password, name })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            localStorage.setItem("token", data.token);
            onSuccess(data.token, data.user);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Staggered animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 }
        },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a14] relative w-full h-full text-black dark:text-white overflow-hidden inset-0 fixed z-50">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="absolute top-6 right-6 z-[60] p-3 rounded-full bg-white/20 dark:bg-black/20 hover:bg-white/40 dark:hover:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/10 transition-all duration-300 text-black dark:text-white group/theme shadow-sm"
            >
                {isDarkMode ? <Sun className="w-5 h-5 group-hover/theme:rotate-90 transition-transform duration-500" /> : <Moon className="w-5 h-5 group-hover/theme:-rotate-12 transition-transform duration-500" />}
            </button>

            {/* Dark Premium Background Layer with Image */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2668&auto=format&fit=crop')] bg-cover bg-center opacity-10 dark:opacity-30 dark:mix-blend-luminosity" />

            {/* Animated Gradient Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 50, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, -50, 0]
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute bottom-1/4 -right-32 w-[30rem] h-[30rem] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"
            />

            <div className="absolute inset-0 bg-white/40 dark:bg-black/50 backdrop-blur-[4px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring", bounce: 0.3 }}
                className="relative z-10 w-full max-w-[420px] p-10 overflow-hidden rounded-[2.5rem] bg-white/70 dark:bg-white/5 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-[0_24px_64px_0_rgba(0,0,0,0.1)] dark:shadow-[0_24px_64px_0_rgba(0,0,0,0.6)] before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/50 dark:before:from-white/10 before:to-transparent before:pointer-events-none group"
            >
                {/* Glossy inner reflection */}
                <div className="absolute inset-[1px] rounded-[2.5rem] ring-1 ring-black/5 dark:ring-white/10 pointer-events-none transition-all duration-500 group-hover:ring-black/10 dark:group-hover:ring-white/20" />

                <div className="flex flex-col items-center mb-10">
                    <motion.div
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 1, type: "spring", bounce: 0.5, delay: 0.2 }}
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 dark:from-blue-400 dark:via-indigo-500 dark:to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/10 dark:shadow-blue-500/20 mb-5 relative group-hover:shadow-blue-500/30 dark:group-hover:shadow-blue-500/40 transition-shadow duration-500"
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <Compass className="w-8 h-8 text-white relative z-10" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-center"
                    >
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-black to-black/70 dark:from-white dark:to-white/70 tracking-tight drop-shadow-sm mb-2">
                            WanderLog
                        </h1>
                        <p className="text-black/50 dark:text-white/50 text-sm font-medium tracking-wide">
                            {isLogin ? "Welcome back to your journey" : "Start your next adventure"}
                        </p>
                    </motion.div>
                </div>

                <motion.form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <AnimatePresence mode="popLayout">
                        {!isLogin && (
                            <motion.div
                                variants={itemVariants as any}
                                layout
                            >
                                <div className="relative group/input">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30 dark:text-white/40 transition-colors group-focus-within/input:text-black dark:group-focus-within/input:text-white" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full Name"
                                        className="w-full bg-white/50 dark:bg-black/20 hover:bg-white darker:hover:bg-black/40 border border-black/10 dark:border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/30 focus:bg-white dark:focus:bg-black/60 focus:border-black/30 dark:focus:border-white/20 transition-all duration-300 font-medium shadow-inner"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants as any} layout>
                        <div className="relative group/input">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30 dark:text-white/40 transition-colors group-focus-within/input:text-black dark:group-focus-within/input:text-white" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="w-full bg-black/20 hover:bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-black/60 focus:border-white/20 transition-all duration-300 font-medium shadow-inner"
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants as any} layout>
                        <div className="relative group/input">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30 dark:text-white/40 transition-colors group-focus-within/input:text-black dark:group-focus-within/input:text-white" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-black/20 hover:bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-black/60 focus:border-white/20 transition-all duration-300 font-medium shadow-inner"
                            />
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                animate={{ opacity: 1, height: "auto", scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                            >
                                <p className="text-red-300 text-sm text-center font-medium bg-red-500/10 py-3 rounded-xl border border-red-500/20 mt-2">
                                    {error}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants as any} layout className="pt-2">
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={loading}
                            type="submit"
                            className="w-full relative overflow-hidden bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-2xl py-3.5 font-bold flex items-center justify-center space-x-2 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group/btn shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 dark:via-black/5 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />

                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-white/70 dark:text-black/70" />
                            ) : (
                                <>
                                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                                    <ArrowRight className="w-5 h-5 text-white/70 dark:text-black/70 group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                    </motion.div>
                </motion.form>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="mt-8 text-center"
                >
                    <p className="text-black/50 dark:text-white/50 text-sm font-medium">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(""); }}
                            className="ml-2 text-primary dark:text-white hover:text-blue-600 dark:hover:text-blue-300 transition-colors font-semibold drop-shadow-sm focus:outline-none focus:underline"
                            type="button"
                        >
                            {isLogin ? "Sign Up" : "Sign In"}
                        </button>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}

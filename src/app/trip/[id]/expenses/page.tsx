/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, Expense } from "@/lib/db";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Receipt } from "lucide-react";
import { getTotalExpensesByTrip, groupExpensesByCategory } from "@/lib/expense-calculator";
import { useState, useEffect } from "react";

export default function ExpensesPage() {
    const router = useRouter();
    const params = useParams();
    const tripId = Number(params.id);

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editForm, setEditForm] = useState<Partial<Expense>>({});
    const [isCreating, setIsCreating] = useState(false);

    const trip = useLiveQuery(() => db.trips.get(tripId));
    const expenses = useLiveQuery(() => db.expenses.where("tripId").equals(tripId).toArray());

    // Currency bindings
    const [currencySymbol, setCurrencySymbol] = useState("$");

    const [baseCurrencyStr, setBaseCurrencyStr] = useState("USD");

    useEffect(() => {
        const code = localStorage.getItem("app_currency") || "USD";
        setBaseCurrencyStr(code);
        const map: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥" };
        setCurrencySymbol(map[code] || "$");

        const handleStorage = () => {
            const updated = localStorage.getItem("app_currency") || "USD";
            setBaseCurrencyStr(updated);
            setCurrencySymbol(map[updated] || "$");
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    async function handleSaveExpense() {
        if (isCreating) {
            await db.expenses.add({
                tripId: tripId,
                amount: editForm.amount || 0,
                // If it's a new expense, try to pick up the global base currency by default
                currency: editForm.currency || baseCurrencyStr,
                category: editForm.category || "Food",
                date: editForm.date || new Date().toISOString().split('T')[0],
                title: editForm.title || "New Expense"
            });
            setIsCreating(false);
        } else if (editingExpense?.id) {
            await db.expenses.update(editingExpense.id, editForm);
            setEditingExpense(null);
        }
    }

    if (!trip || !expenses) return null;

    const normalizeToTarget = (amount: number, fromCurr: string, toCurr: string) => {
        const rates: Record<string, number> = { USD: 1, EUR: 1.1, GBP: 1.25, INR: 0.012, JPY: 0.0067, KRW: 0.00075, ISK: 0.0073 };
        const valInUSD = amount * (rates[fromCurr.toUpperCase()] || 1);
        return valInUSD / (rates[toCurr.toUpperCase()] || 1);
    };

    let normalizedTotal = 0;
    const normalizedGrouped: Record<string, number> = {};
    expenses.forEach(e => {
        const val = normalizeToTarget(e.amount, e.currency || "USD", baseCurrencyStr);
        normalizedTotal += val;
        normalizedGrouped[e.category] = (normalizedGrouped[e.category] || 0) + val;
    });

    const percentUsed = trip.budget ? (normalizedTotal / normalizeToTarget(trip.budget, "USD", baseCurrencyStr)) * 100 : 0;

    // Economics Logic
    const days = Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 3600 * 24)));
    const dailyAvg = normalizedTotal / days;

    const getCountryEconomics = (dest: string, targetCurr: string) => {
        const d = dest.toLowerCase();
        let gdpUSD = 35; // Global Avg Daily GDP
        let cName = "Global Avg";
        if (d.includes('india')) { gdpUSD = 7; cName = "India"; }
        else if (d.includes('iceland')) { gdpUSD = 200; cName = "Iceland"; }
        else if (d.includes('korea')) { gdpUSD = 90; cName = "South Korea"; }
        else if (d.includes('japan')) { gdpUSD = 95; cName = "Japan"; }
        else if (d.includes('greece') || d.includes('santorini')) { gdpUSD = 55; cName = "Greece"; }
        else if (d.includes('south africa') || d.includes('africa')) { gdpUSD = 18; cName = "South Africa"; }

        return { name: cName, dailyTargetVal: normalizeToTarget(gdpUSD, "USD", targetCurr) };
    };

    const eco = getCountryEconomics(trip.destination, baseCurrencyStr);
    const costRatio = eco.dailyTargetVal > 0 ? dailyAvg / eco.dailyTargetVal : 1;

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex items-center space-x-3 py-2">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
            </header>

            {/* Budget Card */}
            <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-start justify-between">
                    <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2 flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(74,222,128,1)]"></span>
                            <span>Total Spent</span>
                        </p>
                        <div className="text-5xl font-black font-sans drop-shadow-lg tracking-tighter">{currencySymbol}{normalizedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p className="text-white/70 text-xs font-medium mt-1">across {days} days • avg {currencySymbol}{Math.max(0, dailyAvg).toLocaleString()}/day</p>
                    </div>

                    {trip.budget && (
                        <div className="mt-8 w-full bg-black/20 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                            <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-3 opacity-90">
                                <span>Budget: {currencySymbol}{normalizeToTarget(trip.budget, "USD", baseCurrencyStr).toLocaleString()}</span>
                                <span>{percentUsed.toFixed(1)}% used</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden shadow-inner flex">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${percentUsed > 90 ? 'bg-red-400' : 'bg-gradient-to-r from-green-400 to-emerald-300'}`}
                                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <Receipt className="absolute -bottom-8 -right-8 w-48 h-48 text-black/10 rotate-[-15deg] pointer-events-none" />
            </div>

            {/* Economic GDP Footprint Widget */}
            <div className="bg-card rounded-3xl border-2 border-dashed border-border p-6 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                            <span>Economic Footprint</span>
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[250px] leading-tight">Comparing your daily average to the local Daily GDP Per Capita index of <strong className="text-foreground">{eco.name}</strong>.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black text-foreground">{costRatio.toFixed(1)}x</div>
                        <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Multiplier</div>
                    </div>
                </div>

                {/* Bar Chart Visualization */}
                <div className="mt-6 space-y-4">
                    {/* Local GDP Baseline */}
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="text-muted-foreground">Local Avg ({eco.name})</span>
                            <span className="text-foreground">{currencySymbol}{eco.dailyTargetVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}/day</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-4 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-500 w-[50%] rounded-full opacity-30" />
                        </div>
                    </div>

                    {/* Your Spend */}
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className={costRatio > 1 ? "text-red-500" : "text-green-500"}>Your Reality</span>
                            <span className="text-foreground">{currencySymbol}{dailyAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}/day</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-4 overflow-hidden relative">
                            <div
                                className={`absolute inset-0 h-full rounded-full transition-all duration-[1500ms] ease-out ${costRatio > 2 ? "bg-gradient-to-r from-red-500 to-red-600" : costRatio > 1 ? "bg-gradient-to-r from-orange-400 to-red-400" : "bg-gradient-to-r from-green-400 to-emerald-500"}`}
                                style={{ width: `${Math.min((costRatio / 2) * 50, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground italic">
                        {costRatio > 2 ? "You're spending significantly more than the local economic baseline! Living luxurious." : costRatio < 0.8 ? "You're heavily undercutting the local average! Ultimate budget backpacker." : "You're blending right into the standard local economic flux!"}
                    </span>
                </div>
            </div>

            {/* Categories */}
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">Categories</h2>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries(normalizedGrouped).map(([cat, amount]) => (
                        amount > 0 && (
                            <div key={cat} className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col justify-center h-20 hover:scale-[1.02] transition-transform">
                                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mb-1">{cat}</span>
                                <span className="text-xl font-black text-foreground">{currencySymbol}{amount.toFixed(2)}</span>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Recent List */}
            <div>
                <h2 className="text-lg font-bold mb-4">Recent</h2>
                <div className="space-y-3">
                    {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                        <div key={exp.id} className="relative group">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                <button
                                    onClick={() => { setEditingExpense(exp); setEditForm(exp); }}
                                    className="p-1.5 bg-secondary text-blue-500 rounded-full hover:bg-blue-500 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></svg>
                                </button>
                                <button
                                    onClick={async () => { if (confirm('Delete expense?')) await db.expenses.delete(exp.id!); }}
                                    className="p-1.5 bg-secondary text-destructive rounded-full hover:bg-destructive hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                                <div>
                                    <div className="font-bold text-foreground">{exp.title}</div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{exp.category} • {exp.date}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-lg text-foreground">
                                        {currencySymbol}{normalizeToTarget(exp.amount, exp.currency || "USD", baseCurrencyStr).toFixed(2)}
                                    </div>
                                    {/* Also subtly show what it was originally recorded as, so they know the native conversion is happening! */}
                                    {(exp.currency && exp.currency !== baseCurrencyStr) && (
                                        <div className="text-[9px] font-bold text-muted-foreground uppercase">{exp.amount} {exp.currency} (native)</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {expenses.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No expenses added yet.
                        </div>
                    )}
                </div>
            </div>

            <div className="fixed bottom-20 right-6 z-40">
                <button
                    onClick={() => { setIsCreating(true); setEditForm({ currency: "USD", category: "Food" }); setEditingExpense(null); }}
                    className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            {(editingExpense || isCreating) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl p-6 border border-border shadow-2xl relative">
                        <h2 className="text-xl font-bold mb-4 text-foreground drop-shadow-sm">{isCreating ? "Add Expense" : "Edit Expense"}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Title</label>
                                <input
                                    className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground"
                                    value={editForm.title || ""}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Amount</label>
                                    <input
                                        type="number"
                                        className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground"
                                        value={editForm.amount || ""}
                                        onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground"
                                        value={editForm.date || ""}
                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground"
                                        value={editForm.category || "Food"}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    >
                                        <option value="Food">Food</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Stay">Stay</option>
                                        <option value="Activities">Activities</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Currency</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-lg p-2.5 mt-1 text-foreground"
                                        value={editForm.currency || "USD"}
                                        onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="INR">INR</option>
                                        <option value="JPY">JPY</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => { setEditingExpense(null); setIsCreating(false); }}
                                className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveExpense}
                                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm active:scale-95 transition-transform"
                            >
                                Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

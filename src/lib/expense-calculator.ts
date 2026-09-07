import { Expense } from "./db";

const FALLBACK_RATES: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    JPY: 154.5,
    GBP: 0.79,
    INR: 83.5,
};

export function getRates(): Record<string, number> {
    if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('currency_rates_v1');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (e) {
                console.error("Failed to parse cached rates", e);
            }
        }
    }
    return FALLBACK_RATES;
}

export async function syncRates() {
    try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await res.json();
        if (data && data.rates) {
            localStorage.setItem('currency_rates_v1', JSON.stringify(data.rates));
            localStorage.setItem('currency_rates_last_sync', new Date().toISOString());
            // Dispatch a storage event so components can optionally re-render if listening
            window.dispatchEvent(new Event("storage"));
        }
    } catch (err) {
        console.error("Failed to sync currency rates", err);
    }
}

export function convertCurrency(amount: number, from: string, to: string = 'USD'): number {
    if (from === to) return amount;
    const rates = getRates();
    const inUSD = amount / (rates[from] || 1);
    return inUSD * (rates[to] || 1);
}

export function getTotalExpensesByTrip(expenses: Expense[], targetCurrency: string = 'USD'): number {
    return expenses.reduce((total, exp) => total + convertCurrency(exp.amount, exp.currency, targetCurrency), 0);
}

export function groupExpensesByCategory(expenses: Expense[], targetCurrency: string = 'USD'): Record<string, number> {
    const grouped: Record<string, number> = {
        Food: 0,
        Transit: 0,
        Stay: 0,
        Activities: 0,
        Other: 0
    };

    expenses.forEach(exp => {
        const category = grouped[exp.category] !== undefined ? exp.category : 'Other';
        grouped[category] += convertCurrency(exp.amount, exp.currency, targetCurrency);
    });

    return grouped;
}

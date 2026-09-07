import { describe, it, expect } from 'vitest';
import { convertCurrency, getTotalExpensesByTrip, groupExpensesByCategory } from '../src/lib/expense-calculator';
import { sortWaypointsByTimeline, groupWaypointsByDay } from '../src/lib/timeline-sorter';
import { Expense, Waypoint } from '../src/lib/db';

describe('Expense Calculator Utility', () => {
    const mockExpenses: Expense[] = [
        { id: 1, tripId: 1, amount: 100, currency: 'USD', category: 'Food', date: '2026-08-20', title: 'Dinner' },
        { id: 2, tripId: 1, amount: 50, currency: 'EUR', category: 'Transit', date: '2026-08-21', title: 'Train' },
    ];

    it('converts currency correctly (USD to EUR)', () => {
        // USD to USD
        expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
        // EUR to USD (50 / 0.9 * 1 = 55.55...)
        expect(convertCurrency(50, 'EUR', 'USD')).toBeCloseTo(55.55, 2);
    });

    it('calculates total expenses in target currency', () => {
        const totalUSD = getTotalExpensesByTrip(mockExpenses, 'USD');
        expect(totalUSD).toBeCloseTo(155.55, 2);
    });

    it('groups expenses by category in target currency', () => {
        const grouped = groupExpensesByCategory(mockExpenses, 'USD');
        expect(grouped.Food).toBe(100);
        expect(grouped.Transit).toBeCloseTo(55.55, 2);
        expect(grouped.Stay).toBe(0);
    });
});

describe('Timeline Sorter Utility', () => {
    const mockWaypoints: Waypoint[] = [
        { id: 2, tripId: 1, lat: 0, lng: 0, timestamp: '2026-08-22T10:00:00Z', tags: [] },
        { id: 1, tripId: 1, lat: 0, lng: 0, timestamp: '2026-08-20T08:00:00Z', tags: [] },
        { id: 3, tripId: 1, lat: 0, lng: 0, timestamp: '2026-08-22T15:00:00Z', tags: [] },
    ];

    it('sorts waypoints chronologically', () => {
        const sorted = sortWaypointsByTimeline(mockWaypoints);
        expect(sorted[0].id).toBe(1);
        expect(sorted[1].id).toBe(2);
        expect(sorted[2].id).toBe(3);
    });

    it('groups waypoints by day', () => {
        const grouped = groupWaypointsByDay(mockWaypoints);
        // Keys will depend on local timezone if parseISO is used directly. 
        // Usually date-fns parseISO returns local time representation, but let's check exact dates.
        const keys = Object.keys(grouped);
        expect(keys.length).toBe(2); // One for 08-20, one for 08-22 in UTC
    });
});

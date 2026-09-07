import Dexie, { type Table } from 'dexie';

export interface Trip {
    id?: number;
    destination: string;
    startDate: string;
    endDate: string;
    coverPhoto?: string;
    budget?: number;
    mode: string; // 'flight', 'car', 'train', etc.
    createdAt?: Date;
}

export interface Waypoint {
    id?: number;
    tripId: number;
    lat: number;
    lng: number;
    timestamp: string;
    note?: string;
    media?: string; // base64 or blob URL (mocked)
    tags: string[];
}

export interface Expense {
    id?: number;
    tripId: number;
    amount: number;
    currency: string;
    category: string; // 'Food', 'Transit', 'Stay', 'Activities'
    date: string;
    title: string;
}

export class WanderLogDB extends Dexie {
    trips!: Table<Trip>;
    waypoints!: Table<Waypoint>;
    expenses!: Table<Expense>;

    constructor() {
        super('wanderlog_db');
        this.version(1).stores({
            trips: '++id, destination, startDate, endDate',
            waypoints: '++id, tripId, timestamp',
            expenses: '++id, tripId, category, date' // 'tripId' and 'category' indexed
        });
    }
}

export const db = new WanderLogDB();

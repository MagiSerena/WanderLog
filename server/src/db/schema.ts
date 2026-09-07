import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name'),
    defaultCurrency: text('default_currency').default('USD'),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const trips = sqliteTable('trips', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id'),
    title: text('title'),
    description: text('description'),
    coverUrl: text('cover_url'),
    startDate: integer('start_date', { mode: 'timestamp' }),
    endDate: integer('end_date', { mode: 'timestamp' }),
    budgetAmount: text('budget_amount'),
    currency: text('currency'),
});

export const waypoints = sqliteTable('waypoints', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tripId: text('trip_id'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    altitude: real('altitude'),
    title: text('title'),
    note: text('note'),
    loggedAt: integer('logged_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const expenses = sqliteTable('expenses', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tripId: text('trip_id'),
    amount: real('amount'),
    convertedAmountUsd: real('converted_amount_usd'),
    currency: text('currency'),
    category: text('category'),
    date: text('date'),
    title: text('title')
});

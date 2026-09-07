/* eslint-disable */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { trips, waypoints, expenses } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

const tripRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {

    // --- GET ALL TRIPS ---
    server.get('/api/trips', async (request, reply) => {
        await request.jwtVerify();
        const user = request.user as { id: string };

        const userTrips = await db.select().from(trips).where(eq(trips.userId, user.id));
        return reply.send({ trips: userTrips });
    });

    // --- CREATE TRIP ---
    const createTripSchema = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        coverUrl: z.string().url().optional(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime().optional(),
        budgetAmount: z.number().optional(),
        currency: z.string().length(3).optional(),
    });

    server.post('/api/trips', async (request, reply) => {
        await request.jwtVerify();
        const user = request.user as { id: string };

        const parsed = createTripSchema.safeParse(request.body);
        if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });

        const [newTrip] = await db.insert(trips).values({
            ...parsed.data,
            startDate: new Date(parsed.data.startDate),
            endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
            budgetAmount: parsed.data.budgetAmount ? parsed.data.budgetAmount.toString() : null,
            userId: user.id,
        } as any).returning();

        return reply.status(201).send({ trip: newTrip });
    });

    // --- GET TRIP DETAILS ---
    server.get('/api/trips/:id', async (request, reply) => {
        await request.jwtVerify();
        const user = request.user as { id: string };
        const tripId = (request.params as any).id;

        const [trip] = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
        if (!trip || trip.userId !== user.id) return reply.status(404).send({ error: 'Trip not found' });

        // Aggregate stats
        const [wpCount] = await db.select({ count: sql<number>`count(*)` }).from(waypoints).where(eq(waypoints.tripId, tripId));
        const [expTotal] = await db.select({ total: sql<number>`sum(${expenses.convertedAmountUsd})` }).from(expenses).where(eq(expenses.tripId, tripId));

        return reply.send({
            trip,
            stats: {
                totalWaypoints: Number(wpCount?.count || 0),
                totalSpentUsd: Number(expTotal?.total || 0),
            }
        });
    });

};

export default tripRoutes;

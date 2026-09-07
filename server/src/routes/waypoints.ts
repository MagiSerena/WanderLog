/* eslint-disable */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { waypoints, trips } from '../db/schema.js';
import { eq, asc, sql } from 'drizzle-orm';

const waypointRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {

    // --- ADD WAYPOINT ---
    const waypointSchema = z.object({
        tripId: z.string().uuid(),
        latitude: z.number(),
        longitude: z.number(),
        altitude: z.number().optional(),
        title: z.string().optional(),
        note: z.string().optional(),
    });

    server.post('/api/waypoints', async (request, reply) => {
        await request.jwtVerify();
        const parsed = waypointSchema.safeParse(request.body);
        if (!parsed.success) return reply.status(400).send({ error: parsed.error.format() });

        const [wp] = await db.insert(waypoints).values(parsed.data).returning();

        return reply.status(201).send({ waypoint: wp });
    });

    // --- GET ROUTE (GEOJSON) ---
    server.get('/api/trips/:id/route.geojson', async (request, reply) => {
        await request.jwtVerify();
        const tripId = (request.params as any).id;

        const routeData = await db.select({
            id: waypoints.id,
            longitude: waypoints.longitude,
            latitude: waypoints.latitude,
            title: waypoints.title,
            note: waypoints.note,
            loggedAt: waypoints.loggedAt,
        }).from(waypoints)
            .where(eq(waypoints.tripId, tripId))
            .orderBy(asc(waypoints.loggedAt));

        if (routeData.length === 0) {
            return reply.send({ type: "FeatureCollection", features: [] });
        }

        const coordinates = routeData.map(wp => [wp.longitude, wp.latitude]);

        const geoJson = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates
                    },
                    properties: {
                        tripId,
                        waypoints: routeData
                    }
                }
            ]
        };

        return reply.send(geoJson);
    });

};

export default waypointRoutes;

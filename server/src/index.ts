/* eslint-disable */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { db } from './db';
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import waypointRoutes from './routes/waypoints';
dotenv.config();

const server = Fastify({
    logger: true,
});

server.register(cors, {
    origin: '*', // For dev
});

server.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'wanderlog_super_secret_dev_key',
});

server.get('/health', async () => {
    return { status: 'ok', time: new Date().toISOString() };
});

server.register(authRoutes);
server.register(tripRoutes);
server.register(waypointRoutes);

const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
        console.log('Backend listening heavily on port 3001');
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();

/* eslint-disable */
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import * as argon2 from 'argon2';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const authRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
    // --- REGISTER ---
    const registerSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(2),
    });

    server.post('/api/auth/register', async (request, reply) => {
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Invalid input', details: parsed.error.format() });
        }
        const { email, password, name } = parsed.data;

        // Check if user exists
        const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existing.length > 0) {
            return reply.status(409).send({ error: 'Email already registered' });
        }

        const passwordHash = await argon2.hash(password);

        const [newUser] = await db.insert(users).values({
            email,
            passwordHash,
            name,
        }).returning({ id: users.id, email: users.email, name: users.name });

        const token = server.jwt.sign({ id: newUser.id, email: newUser.email });
        return reply.status(201).send({ user: newUser, token });
    });


    // --- LOGIN ---
    const loginSchema = z.object({
        email: z.string().email(),
        password: z.string(),
    });

    server.post('/api/auth/login', async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Invalid input' });
        }
        const { email, password } = parsed.data;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const isValid = await argon2.verify(user.passwordHash, password);
        if (!isValid) {
            return reply.status(401).send({ error: 'Invalid credentials' });
        }

        const token = server.jwt.sign({ id: user.id, email: user.email });
        return reply.send({
            user: { id: user.id, email: user.email, name: user.name },
            token
        });
    });

    // --- ME (PROTECTED) ---
    server.get('/api/auth/me', async (request, reply) => {
        try {
            await request.jwtVerify();
            const decoded = request.user as { id: string };

            const [user] = await db.select({
                id: users.id,
                email: users.email,
                name: users.name,
                defaultCurrency: users.defaultCurrency,
                createdAt: users.createdAt,
            }).from(users).where(eq(users.id, decoded.id)).limit(1);

            if (!user) {
                return reply.status(404).send({ error: 'User not found' });
            }

            return reply.send({ user });
        } catch (err) {
            return reply.status(401).send({ error: 'Invalid or missing token' });
        }
    });

    // --- UPDATE ME (PROTECTED) ---
    const updateSchema = z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
    });

    server.put('/api/auth/me', async (request, reply) => {
        try {
            await request.jwtVerify();
            const decoded = request.user as { id: string };

            const parsed = updateSchema.safeParse(request.body);
            if (!parsed.success) {
                return reply.status(400).send({ error: 'Invalid input' });
            }

            const { name, email } = parsed.data;

            if (!name && !email) {
                return reply.status(400).send({ error: 'No fields to update' });
            }

            if (email) {
                const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
                if (existing.length > 0 && existing[0].id !== decoded.id) {
                    return reply.status(409).send({ error: 'Email already in use' });
                }
            }

            const [updatedUser] = await db
                .update(users)
                .set({
                    ...(name && { name }),
                    ...(email && { email }),
                })
                .where(eq(users.id, decoded.id))
                .returning({
                    id: users.id,
                    email: users.email,
                    name: users.name,
                    defaultCurrency: users.defaultCurrency,
                });

            if (!updatedUser) {
                return reply.status(404).send({ error: 'User not found' });
            }

            return reply.send({ user: updatedUser });
        } catch (err) {
            return reply.status(401).send({ error: 'Invalid or missing token' });
        }
    });
};

export default authRoutes;

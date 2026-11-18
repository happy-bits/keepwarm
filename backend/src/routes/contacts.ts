import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';
import { type AuthVariables } from '../middleware/auth.js';
import { withEntityAccess } from './helpers.js';
import { ERROR_MESSAGES, ROLES } from '../constants.js';

const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
});

const createInteractionSchema = z.object({
  occurredAt: z.string().datetime({ offset: true }).optional(),
  type: z.enum(['call', 'email', 'meeting', 'other']),
  summary: z.string().trim().min(1, 'Summary is required'),
  outcome: z.string().trim().optional().nullable(),
  nextStep: z.string().trim().optional().nullable(),
});

export function createContactRoutes(db: BetterSQLite3Database<typeof schema>) {
  const app = new Hono<{ Variables: AuthVariables }>();

  // GET /contacts - List contacts (sellers see their own, admins see all)
  app.get('/', (c) => {
    const user = c.get('user');

    let query = db.select().from(schema.contacts);

    // Sellers only see their own contacts
    if (user.role === ROLES.SELLER) {
      query = query.where(eq(schema.contacts.sellerId, user.id)) as typeof query;
    }

    const contacts = query.all();
    return c.json({ contacts });
  });

  // GET /contacts/:id - Get contact details
  app.get('/:id', (c) => {
    const result = withEntityAccess<schema.Contact>(c, db, schema.contacts, 'Contact');
    if (!result.success) return result.response;

    return c.json({ contact: result.entity });
  });

  // GET /contacts/:id/interactions - List interactions for an accessible contact
  app.get('/:id/interactions', (c) => {
    const result = withEntityAccess<schema.Contact>(c, db, schema.contacts, 'Contact');
    if (!result.success) return result.response;

    const interactions = db
      .select({
        id: schema.interactions.id,
        contactId: schema.interactions.contactId,
        sellerId: schema.interactions.sellerId,
        sellerName: schema.users.name,
        occurredAt: schema.interactions.occurredAt,
        type: schema.interactions.type,
        summary: schema.interactions.summary,
        outcome: schema.interactions.outcome,
        nextStep: schema.interactions.nextStep,
        createdAt: schema.interactions.createdAt,
      })
      .from(schema.interactions)
      .innerJoin(schema.users, eq(schema.interactions.sellerId, schema.users.id))
      .where(eq(schema.interactions.contactId, result.entity.id))
      .orderBy(desc(schema.interactions.occurredAt), desc(schema.interactions.id))
      .all();

    return c.json({ interactions });
  });

  // POST /contacts/:id/interactions - Record an interaction for an accessible contact
  app.post('/:id/interactions', zValidator('json', createInteractionSchema), (c) => {
    const result = withEntityAccess<schema.Contact>(c, db, schema.contacts, 'Contact');
    if (!result.success) return result.response;

    const user = c.get('user');
    const data = c.req.valid('json');
    const createdAt = new Date().toISOString();
    const interaction = db
      .insert(schema.interactions)
      .values({
        contactId: result.entity.id,
        sellerId: user.id,
        occurredAt: data.occurredAt ? new Date(data.occurredAt).toISOString() : createdAt,
        type: data.type,
        summary: data.summary,
        outcome: data.outcome || null,
        nextStep: data.nextStep || null,
        createdAt,
      })
      .returning()
      .get();

    return c.json({
      interaction: {
        ...interaction,
        sellerName: user.name,
      },
    }, 201);
  });

  // POST /contacts - Create new contact
  app.post('/', zValidator('json', createContactSchema), (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');

    const now = new Date().toISOString();

    const contact = db
      .insert(schema.contacts)
      .values({
        sellerId: user.id,
        name: data.name,
        email: data.email ?? null,
        company: data.company ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();

    return c.json({ contact }, 201);
  });

  // DELETE /contacts/:id - Delete contact
  app.delete('/:id', (c) => {
    const result = withEntityAccess<schema.Contact>(c, db, schema.contacts, 'Contact');
    if (!result.success) return result.response;

    db.delete(schema.contacts).where(eq(schema.contacts.id, result.entity.id)).run();

    return c.json({ message: ERROR_MESSAGES.deletedSuccessfully('Contact') });
  });

  return app;
}

import { beforeEach, describe, expect, it } from 'vitest';
import {
  expectBadRequest,
  expectCreated,
  expectForbidden,
  expectOk,
  get,
  post,
  setupTest,
  type TestContext,
} from './setup.js';

describe('Contact Interaction Routes', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTest();
  });

  describe('POST /api/contacts/:id/interactions', () => {
    it('saves an interaction with its date, optional fields, and recording seller', async () => {
      const occurredAt = '2024-06-20T14:30:00.000Z';
      const created = await expectCreated<{
        interaction: {
          id: number;
          contactId: number;
          sellerId: number;
          sellerName: string;
          occurredAt: string;
          type: string;
          summary: string;
          outcome: string;
          nextStep: string;
        };
      }>(
        await post(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken, {
          occurredAt,
          type: 'meeting',
          summary: '  Discussed the proposal  ',
          outcome: 'Requested revised pricing',
          nextStep: 'Send updated proposal',
        })
      );

      expect(created.interaction).toMatchObject({
        contactId: ctx.contactId,
        sellerId: ctx.sellerId,
        sellerName: 'Test Seller',
        occurredAt,
        type: 'meeting',
        summary: 'Discussed the proposal',
        outcome: 'Requested revised pricing',
        nextStep: 'Send updated proposal',
      });

      const history = await expectOk<{ interactions: typeof created.interaction[] }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken)
      );
      expect(history.interactions).toEqual([created.interaction]);
    });

    it('defaults the interaction date and optional fields when omitted', async () => {
      const beforeSave = Date.now();
      const created = await expectCreated<{
        interaction: { occurredAt: string; outcome: string | null; nextStep: string | null };
      }>(
        await post(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken, {
          type: 'call',
          summary: 'Discussed timeline',
        })
      );

      expect(new Date(created.interaction.occurredAt).getTime()).toBeGreaterThanOrEqual(beforeSave);
      expect(created.interaction.outcome).toBeNull();
      expect(created.interaction.nextStep).toBeNull();
    });

    it('rejects a missing or blank summary without creating an interaction', async () => {
      await expectBadRequest(
        await post(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken, {
          type: 'email',
          summary: '   ',
        })
      );

      const history = await expectOk<{ interactions: unknown[] }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken)
      );
      expect(history.interactions).toHaveLength(0);
    });

    it('rejects invalid interaction types and dates', async () => {
      await expectBadRequest(
        await post(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken, {
          type: 'text',
          summary: 'Invalid type',
        })
      );
      await expectBadRequest(
        await post(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken, {
          type: 'call',
          summary: 'Invalid date',
          occurredAt: 'not-a-date',
        })
      );
    });

    it('does not allow a seller to add interactions to another seller contact', async () => {
      await expectForbidden(
        await post(ctx.app, `/api/contacts/${ctx.contact2Id}/interactions`, ctx.sellerToken, {
          type: 'call',
          summary: 'Unauthorized interaction',
        })
      );
    });
  });

  describe('GET /api/contacts/:id/interactions', () => {
    it('returns interactions newest first', async () => {
      for (const [occurredAt, summary] of [
        ['2024-01-15T10:00:00.000Z', 'First'],
        ['2024-03-15T10:00:00.000Z', 'Latest'],
        ['2024-02-15T10:00:00.000Z', 'Middle'],
      ]) {
        await post(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken, {
          occurredAt,
          type: 'email',
          summary,
        });
      }

      const history = await expectOk<{ interactions: { summary: string }[] }>(
        await get(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.sellerToken)
      );
      expect(history.interactions.map(({ summary }) => summary)).toEqual([
        'Latest',
        'Middle',
        'First',
      ]);
    });

    it('denies access to interactions for another seller contact', async () => {
      await expectForbidden(
        await get(ctx.app, `/api/contacts/${ctx.contactId}/interactions`, ctx.seller2Token)
      );
    });

    it('allows admins to view interactions for any contact', async () => {
      await post(ctx.app, `/api/contacts/${ctx.contact2Id}/interactions`, ctx.seller2Token, {
        type: 'meeting',
        summary: 'Other seller contact interaction',
      });

      const history = await expectOk<{ interactions: { contactId: number; summary: string }[] }>(
        await get(ctx.app, `/api/contacts/${ctx.contact2Id}/interactions`, ctx.adminToken)
      );
      expect(history.interactions).toHaveLength(1);
      expect(history.interactions[0]).toMatchObject({
        contactId: ctx.contact2Id,
        summary: 'Other seller contact interaction',
      });
    });
  });
});

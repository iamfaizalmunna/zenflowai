import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildKbDraftFromTicket } from './kbDraft';

describe('KB draft from ticket', () => {
  it('refuses to draft when there is no staff reply', () => {
    assert.equal(
      buildKbDraftFromTicket({
        ticketNumber: '#ZEN-0001',
        title: 'VPN',
        description: 'Cannot connect',
        replies: [{ body: 'Please help', type: 'REPLY', isStaff: false }],
      }),
      null
    );
  });

  it('builds an unpublished-style draft from the last staff reply', () => {
    const draft = buildKbDraftFromTicket({
      ticketNumber: '#ZEN-0042',
      title: 'VPN drops',
      description: 'Tunnel dies after 10 minutes',
      replies: [
        { body: 'Try another VPN region and reconnect the tunnel.', type: 'REPLY', isStaff: true },
        { body: 'Nova guess', type: 'REPLY', isStaff: true, isAi: true },
      ],
    });
    assert.ok(draft);
    assert.match(draft.title, /ZEN-0042/);
    assert.match(draft.body, /Tunnel dies/);
    assert.match(draft.body, /Try another VPN region/);
    assert.equal(draft.body.includes('Nova guess'), false);
  });

  it('ignores notes and short staff replies', () => {
    assert.equal(
      buildKbDraftFromTicket({
        ticketNumber: '#ZEN-0003',
        title: 'VPN',
        description: 'Down',
        replies: [
          { body: 'Internal note only, not a customer reply', type: 'NOTE', isStaff: true },
          { body: 'too short', type: 'REPLY', isStaff: true },
        ],
      }),
      null,
    );
  });

  it('falls back to a staff AI reply only when no human reply exists', () => {
    const draft = buildKbDraftFromTicket({
      ticketNumber: '#ZEN-0002',
      title: 'Login',
      description: 'Cannot sign in',
      replies: [{ body: 'Reset cache then retry login form', type: 'REPLY', isStaff: true, isAi: true }],
    });
    assert.ok(draft);
    assert.match(draft.body, /Reset cache/);
  });
});

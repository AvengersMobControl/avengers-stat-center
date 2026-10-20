'use strict';

/**
 * AVENGERS-only Discord publication destination resolver.
 *
 * This is a server-only routing helper, NOT a Discord transport or an
 * authorization/approval decision. No imports, PNG sends or deletes here.
 * Keep this module out of the public site build and never include the
 * Discord bot token in front-end source or logs.
 */
const CHANNEL_ENV_KEY = 'AVENGERS_DISCORD_SUMMARY_CHANNEL_ID';
const ALLOWED_CLANS = Object.freeze(['AVENGERS', 'AV-2']);
const ALLOWED_KINDS = Object.freeze(['piggy', 'space', 'flash', 'kraken', 'weekly']);

function resolveSummaryDestination(request, env = process.env) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new Error('AVENGERS summary routing: event and clan are required');
  }
  if (['channelId', 'destinationChannelId', 'discordChannelId'].some(key =>
    Object.prototype.hasOwnProperty.call(request, key))) {
    throw new Error('AVENGERS summary routing: caller-supplied destination forbidden');
  }
  if (!ALLOWED_CLANS.includes(request.clan) || !ALLOWED_KINDS.includes(request.kind)) {
    throw new Error('AVENGERS summary routing: unsupported event or event-time clan');
  }
  const channelId = env?.[CHANNEL_ENV_KEY];
  if (typeof channelId !== 'string' || !/^\d{17,20}$/.test(channelId)) {
    throw new Error('AVENGERS summary routing: authorized destination is not configured');
  }
  return Object.freeze({ channelId, clan: request.clan, kind: request.kind });
}
module.exports = Object.freeze({ CHANNEL_ENV_KEY, ALLOWED_CLANS, ALLOWED_KINDS, resolveSummaryDestination });

/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Actor fields Fineract exposes on account application timelines. */
export type TimelineActorFields = {
  firstname?: string | null;
  lastname?: string | null;
  username?: string | null;
};

/**
 * Prefer full name; fall back to username.
 * Use for all account timelines (savings, loans/WCL, FD, RD, shares).
 */
export function formatTimelineActor(
  actor: TimelineActorFields | null | undefined
): string | undefined {
  if (!actor) {
    return undefined;
  }
  const fullName = [actor.firstname?.trim(), actor.lastname?.trim()].filter(Boolean).join(' ');
  if (fullName) {
    return fullName;
  }
  const username = actor.username?.trim();
  return username || undefined;
}

/** Convenience for timeline rows: `{role}ByFirstname|Lastname|Username`. */
export function formatTimelineActorByRole(
  timeline: object | null | undefined,
  role:
    | 'submitted'
    | 'approved'
    | 'activated'
    | 'closed'
    | 'disbursed'
    | 'rejected'
    | 'withdrawn'
    | 'writeOff'
    | 'chargedOff'
): string | undefined {
  if (!timeline) {
    return undefined;
  }
  const row = timeline as Record<string, unknown>;
  const firstname = row[`${role}ByFirstname`];
  const lastname = row[`${role}ByLastname`];
  const username = row[`${role}ByUsername`];
  return formatTimelineActor({
    firstname: typeof firstname === 'string' ? firstname : undefined,
    lastname: typeof lastname === 'string' ? lastname : undefined,
    username: typeof username === 'string' ? username : undefined
  });
}

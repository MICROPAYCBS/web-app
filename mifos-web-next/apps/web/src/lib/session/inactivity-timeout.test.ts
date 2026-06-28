/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { getInactivityTimeoutConfig } from './inactivity-timeout-config';
import { createInactivityTimerController } from './inactivity-timer';

describe('inactivity timeout config', () => {
  it('uses bankayo-style defaults (15 min idle, 60 s warning)', () => {
    const config = getInactivityTimeoutConfig({});
    assert.equal(config.enabled, true);
    assert.equal(config.timeoutMs, 15 * 60 * 1000);
    assert.equal(config.warningMs, 60 * 1000);
    assert.equal(config.warningSeconds, 60);
  });

  it('disables idle sign-out when timeout minutes is 0', () => {
    const config = getInactivityTimeoutConfig({
      NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES: '0'
    });
    assert.equal(config.enabled, false);
  });

  it('parses custom env values', () => {
    const config = getInactivityTimeoutConfig({
      NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES: '30',
      NEXT_PUBLIC_SESSION_IDLE_WARNING_SECONDS: '120'
    });
    assert.equal(config.enabled, true);
    assert.equal(config.timeoutMs, 30 * 60 * 1000);
    assert.equal(config.warningMs, 120 * 1000);
    assert.equal(config.warningSeconds, 120);
  });
});

describe('inactivity timer controller', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout'] });
    if (typeof globalThis.window === 'undefined') {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: new EventTarget()
      });
    }
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it('fires warning then timeout', () => {
    const events: string[] = [];
    const controller = createInactivityTimerController({
      timeoutMs: 5000,
      warningMs: 2000,
      onWarning: () => events.push('warning'),
      onTimeout: () => events.push('timeout')
    });

    controller.start();
    mock.timers.tick(3000);
    assert.deepEqual(events, ['warning']);

    mock.timers.tick(2000);
    assert.deepEqual(events, ['warning', 'timeout']);
    controller.dispose();
  });

  it('does not reset timers from activity while warning is visible', () => {
    const events: string[] = [];
    const controller = createInactivityTimerController({
      timeoutMs: 5000,
      warningMs: 2000,
      onWarning: () => events.push('warning'),
      onTimeout: () => events.push('timeout')
    });

    controller.start();
    mock.timers.tick(3000);
    window.dispatchEvent(new Event('mousemove'));
    mock.timers.tick(2000);
    assert.deepEqual(events, ['warning', 'timeout']);
    controller.dispose();
  });

  it('reset dismisses warning state and reschedules timers', () => {
    const events: string[] = [];
    const controller = createInactivityTimerController({
      timeoutMs: 5000,
      warningMs: 2000,
      onWarning: () => events.push('warning'),
      onTimeout: () => events.push('timeout'),
      onReset: () => events.push('reset')
    });

    controller.start();
    mock.timers.tick(3000);
    controller.reset();
    assert.deepEqual(events, ['warning', 'reset']);

    mock.timers.tick(3000);
    assert.deepEqual(events, ['warning', 'reset', 'warning']);

    mock.timers.tick(2000);
    assert.deepEqual(events, ['warning', 'reset', 'warning', 'timeout']);
    controller.dispose();
  });
});

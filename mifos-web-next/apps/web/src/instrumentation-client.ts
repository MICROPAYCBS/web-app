/**
 * Copyright since 2026 MicroPay
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as Sentry from '@sentry/nextjs';
import { isSentryEnabled, sharedSentryInitOptions } from './sentry.shared';

Sentry.init(sharedSentryInitOptions());

export const onRouterTransitionStart = isSentryEnabled()
  ? Sentry.captureRouterTransitionStart
  : undefined;

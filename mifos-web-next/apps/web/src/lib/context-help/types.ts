/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** One help topic within a screen — maps to a sidebar section and field hints. */
export interface ContextHelpSection {
  id: string;
  title: string;
  /** Plain-language paragraphs shown in the help sidebar. */
  body: string[];
}

/** Full help document for a single screen. */
export interface ContextHelpContent {
  title: string;
  /** Short intro shown at the top of the sidebar. */
  summary: string;
  sections: ContextHelpSection[];
}

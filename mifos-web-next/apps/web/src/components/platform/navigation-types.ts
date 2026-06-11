/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Serializable nav payload passed from server layout to client shell. */
export interface PlatformNavLink {
  id: string;
  href: string;
  label: string;
  icon?: string;
  status: 'live' | 'soon';
  parityStatus: 'todo' | 'in_progress' | 'done' | 'n/a';
  keywords: string[];
}

export interface PlatformNavGroup {
  id: string;
  label: string;
  icon?: string;
  defaultOpen: boolean;
  items: PlatformNavLink[];
}

export interface PlatformNavStructure {
  featured: PlatformNavLink[];
  groups: PlatformNavGroup[];
  quickFind: PlatformNavLink[];
}

/** A nav link surfaced by Find, with the section it belongs to (group or quick access). */
export interface PlatformNavSearchResult {
  link: PlatformNavLink;
  sectionLabel: string;
}

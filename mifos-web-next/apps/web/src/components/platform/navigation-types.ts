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
  keywords: string[];
}

export interface PlatformNavGroup {
  id: string;
  label: string;
  defaultOpen: boolean;
  items: PlatformNavLink[];
}

export interface PlatformNavStructure {
  featured: PlatformNavLink[];
  groups: PlatformNavGroup[];
  quickFind: PlatformNavLink[];
}

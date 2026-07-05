/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Horizontal inset for readable content inside full-bleed section borders. */
export const platformInsetX = 'px-4 md:px-6';

/** Standard padded region inside a full-bleed bordered section. */
export const platformInset = 'px-4 py-4 md:px-6 md:py-6';

/**
 * Scroll region for simple platform pages (dashboard, settings) that do not use
 * ListPage, DetailPage, or FormWizard — those shells own their own overflow areas.
 */
export const platformScrollRegion =
  'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain';

/**
 * Fixed page header padding — use via {@link PageHeader} only.
 * Detail, list, and wizard shells share this top spacing.
 */
export const pageHeaderPadding = 'pb-4 pt-5';

/** Top inset for detail sidebar rails — aligns with {@link pageHeaderPadding}. */
export const detailSidebarTopPadding = 'pt-5';

/** Horizontal inset for detail sidebar nav (scroll region below top inset). */
export const detailSidebarInsetX = platformInsetX;

/** Vertical rhythm between blocks inside a page header (back link, title, toolbar). */
export const pageHeaderContentSpacing = 'space-y-4';

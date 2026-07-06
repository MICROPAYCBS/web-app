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

/** Top inset for page shells — matches {@link platformInset} vertical rhythm. */
export const platformDetailTopInset = 'pt-4 md:pt-6';

/**
 * Bounded region below the platform shell site header.
 * Platform routes fill this; scrolling must stay inside page shells or
 * {@link platformScrollRegion}, never on the document.
 */
export const platformContentArea =
  '@container/main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden';

/**
 * Root shell for ListPage, DetailPage, and FormWizard — fills {@link platformContentArea}.
 */
export const platformPageShell =
  'flex min-h-0 flex-1 flex-col overflow-hidden pt-4 md:pt-6';

/**
 * Flex chain for nested App Router layouts between platformContentArea and page shells.
 * No top inset — page shells own {@link platformDetailTopInset}.
 */
export const platformRouteLayout = 'flex min-h-0 flex-1 flex-col overflow-hidden';

/**
 * Sidebar rail + main column row inside FormWizard (header sits above this row).
 */
export const platformSidebarRowLayout =
  'flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row';

/**
 * Detail pages with a left rail — header spans full width on lg so its bottom
 * border is continuous; mobile order stays nav → header → main.
 */
export const platformDetailSidebarGridLayout = [
  'grid min-h-0 flex-1 grid-cols-1 overflow-hidden pt-4 md:pt-6',
  '[grid-template-areas:"nav"_"header"_"main"]',
  'lg:grid-cols-[14rem_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]',
  'xl:grid-cols-[15rem_minmax(0,1fr)]',
  'lg:[grid-template-areas:"header_header"_"nav_main"]'
].join(' ');

/** Grid placement for {@link platformDetailSidebarGridLayout} regions. */
export const detailSidebarGridAreaNav = '[grid-area:nav]';
export const detailSidebarGridAreaHeader = '[grid-area:header]';
export const detailSidebarGridAreaMain = '[grid-area:main]';

/**
 * Scroll region for simple platform pages (dashboard, settings) that do not use
 * ListPage, DetailPage, or FormWizard — those shells own their own overflow areas.
 */
export const platformScrollRegion =
  'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain';

/**
 * Fixed page header padding — use via {@link PageHeader} only.
 * Top inset lives on {@link platformPageShell} / {@link platformSidebarRowLayout}.
 */
export const pageHeaderPadding = 'pb-4 md:pb-6';

/** Horizontal inset for detail sidebar nav. */
export const detailSidebarInsetX = platformInsetX;

/** Scroll region padding for detail sidebar nav (top inset from lg when nav sits below header). */
export const detailSidebarScrollPadding = 'pb-4 md:pb-6 max-lg:pt-0 lg:pt-6';

/** Vertical rhythm between blocks inside a page header (back link, title, toolbar). */
export const pageHeaderContentSpacing = 'space-y-4';

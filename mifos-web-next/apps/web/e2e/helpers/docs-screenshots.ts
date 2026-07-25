/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';

const VIEWPORT = { width: 1280, height: 800 } as const;

/**
 * Resolve `public/img` root for handbook screenshots.
 *
 * - `DOCS_PUBLIC_IMG` — absolute or cwd-relative path (CI artifact dir)
 * - default — sibling Micropay CBS Docs repo next to `web-app`:
 *   `micropay/documentation/public/img`
 *   (from `apps/web`: ../../../../documentation/public/img)
 */
export function resolveDocsPublicImgRoot(fromDir = process.cwd()): string {
  if (process.env.DOCS_PUBLIC_IMG?.trim()) {
    return path.resolve(process.env.DOCS_PUBLIC_IMG.trim());
  }

  return path.resolve(fromDir, '../../../../documentation/public/img');
}

export function docsScreenshotPath(relativeUnderImg: string, fromDir = process.cwd()): string {
  const normalized = relativeUnderImg.replace(/^\//, '').replace(/\\/g, '/');
  return path.join(resolveDocsPublicImgRoot(fromDir), ...normalized.split('/'));
}

/**
 * Capture a viewport screenshot for the handbook (light mode, ~1280px wide).
 * `relativeUnderImg` is relative to `public/img`, e.g.
 * `administrators/organization/offices-list.png`.
 */
export async function captureDocsScreenshot(page: Page, relativeUnderImg: string) {
  const filePath = docsScreenshotPath(relativeUnderImg);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  await page.setViewportSize(VIEWPORT);

  // Prefer light mode so handbook shots match authoring guide.
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  });

  await page.screenshot({
    path: filePath,
    fullPage: false,
    animations: 'disabled'
  });

  return filePath;
}

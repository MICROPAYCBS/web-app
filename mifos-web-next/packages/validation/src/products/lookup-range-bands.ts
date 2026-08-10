/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

export type LookupRangeBand = {
  /** Inclusive lower bound. */
  from: number;
  /** Exclusive upper bound; null = open-ended. */
  to: number | null;
};

export type LookupRangeBandIssue = {
  path: (string | number)[];
  message: string;
};

/**
 * Lookup-style bands: [from, to), first starts at 0, last open-ended,
 * contiguous (no gaps), and no overlaps.
 */
export function collectLookupRangeBandIssues(
  bands: LookupRangeBand[],
  options: {
    pathPrefix: (string | number)[];
    fromField: string;
    toField: string;
    entityLabel: string;
    emptyMessage: string;
  }
): LookupRangeBandIssue[] {
  const { pathPrefix, fromField, toField, entityLabel, emptyMessage } = options;
  const issues: LookupRangeBandIssue[] = [];

  if (bands.length === 0) {
    issues.push({ path: pathPrefix, message: emptyMessage });
    return issues;
  }

  if (bands[0].from !== 0) {
    issues.push({
      path: [...pathPrefix, 0, fromField],
      message: `The first ${entityLabel} must start at 0.`
    });
  }

  const lastIndex = bands.length - 1;
  if (bands[lastIndex].to != null) {
    issues.push({
      path: [...pathPrefix, lastIndex, toField],
      message: `The last ${entityLabel} must be open-ended (leave To blank).`
    });
  }

  for (let index = 0; index < bands.length; index++) {
    const band = bands[index];
    const isLast = index === lastIndex;

    if (band.to != null && band.to <= band.from) {
      issues.push({
        path: [...pathPrefix, index, toField],
        message: 'Range to must be greater than range from.'
      });
    }

    if (!isLast && band.to == null) {
      issues.push({
        path: [...pathPrefix, index, toField],
        message: `Only the last ${entityLabel} may be open-ended (blank to).`
      });
    }

    if (index === 0) {
      continue;
    }

    const previous = bands[index - 1];
    if (previous.to == null) {
      continue;
    }

    if (band.from < previous.to) {
      issues.push({
        path: [...pathPrefix, index, fromField],
        message: `Overlaps the previous ${entityLabel} (must start at ${previous.to}).`
      });
    } else if (band.from > previous.to) {
      issues.push({
        path: [...pathPrefix, index, fromField],
        message: `Gap after the previous ${entityLabel} (must start at ${previous.to}).`
      });
    }
  }

  return issues;
}

export function validateLookupRangeBands(
  bands: LookupRangeBand[],
  addIssue: (path: (string | number)[], message: string) => void,
  options: {
    pathPrefix: (string | number)[];
    fromField: string;
    toField: string;
    entityLabel: string;
    emptyMessage: string;
  }
): void {
  for (const issue of collectLookupRangeBandIssues(bands, options)) {
    addIssue(issue.path, issue.message);
  }
}

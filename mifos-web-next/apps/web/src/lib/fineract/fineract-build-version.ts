/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/** Git short SHA length shown with Fineract release versions (matches `git rev-parse --short`). */
export const FINERACT_BUILD_COMMIT_LENGTH = 7;

export type FineractBuildVersion = {
  release: string;
  commit?: string;
};

const TRAILING_COMMIT_PATTERN = /^(.*?)[-+]([0-9a-f]{7,40})$/i;
const HEX_COMMIT_PATTERN = /^[0-9a-f]+$/i;

export function abbreviateFineractBuildCommit(
  commitId: string | undefined | null,
  length = FINERACT_BUILD_COMMIT_LENGTH
): string | undefined {
  if (typeof commitId !== 'string') {
    return undefined;
  }
  const trimmed = commitId.trim();
  if (!trimmed || !HEX_COMMIT_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed.slice(0, length).toLowerCase();
}

/**
 * Parse Fineract `git.build.version` / `build.version` strings.
 * Handles trailing commit suffixes such as `1.12.0-SNAPSHOT-abc1234`.
 */
export function parseFineractBuildVersion(
  raw: string | undefined | null
): FineractBuildVersion | null {
  const text = raw?.trim();
  if (!text) {
    return null;
  }

  const match = text.match(TRAILING_COMMIT_PATTERN);
  if (match) {
    const release = match[1].trim();
    const commit = abbreviateFineractBuildCommit(match[2]);
    if (release) {
      return commit ? { release, commit } : { release };
    }
  }

  return { release: text };
}

export function formatFineractBuildVersionLabel(build: FineractBuildVersion): string {
  if (build.commit) {
    return `${build.release}+${build.commit}`;
  }
  return build.release;
}

export type FineractActuatorGitCommitId = {
  abbrev?: string;
  full?: string;
  describe?: string;
};

export type FineractActuatorGitCommit = {
  id?: string | FineractActuatorGitCommitId;
  time?: string;
  /** Flattened git-properties key when Spring exposes it literally. */
  'id.abbrev'?: string;
};

export type FineractActuatorInfo = {
  build?: { version?: string };
  git?: {
    build?: { version?: string };
    commit?: FineractActuatorGitCommit;
  };
};

function commitIdFromActuatorGit(
  commit: FineractActuatorGitCommit | undefined
): string | undefined {
  if (!commit) {
    return undefined;
  }
  if (typeof commit['id.abbrev'] === 'string') {
    return commit['id.abbrev'];
  }
  const id = commit.id;
  if (typeof id === 'string') {
    return id;
  }
  if (id && typeof id === 'object') {
    if (typeof id.abbrev === 'string') {
      return id.abbrev;
    }
    if (typeof id.full === 'string') {
      return id.full;
    }
  }
  return undefined;
}

function commitFromActuatorGit(
  commit: FineractActuatorGitCommit | undefined
): string | undefined {
  return abbreviateFineractBuildCommit(commitIdFromActuatorGit(commit));
}

/** Resolve release + commit from Spring `/actuator/info` payload. */
export function resolveFineractBuildVersion(
  info: FineractActuatorInfo | null | undefined
): FineractBuildVersion | null {
  if (!info || typeof info !== 'object') {
    return null;
  }
  const rawVersion = info.build?.version ?? info.git?.build?.version;
  const parsed = parseFineractBuildVersion(rawVersion);
  const commit = parsed?.commit ?? commitFromActuatorGit(info.git?.commit);

  if (!parsed && !commit) {
    return null;
  }

  const release = parsed?.release ?? rawVersion?.trim();
  if (!release) {
    return commit ? { release: 'unknown', commit } : null;
  }

  return commit ? { release, commit } : { release };
}

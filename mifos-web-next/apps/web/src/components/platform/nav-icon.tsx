'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
  BookOpen,
  Building,
  Building2,
  Calculator,
  FileBarChart,
  Inbox,
  Landmark,
  LayoutDashboard,
  Package,
  PiggyBank,
  Search,
  Settings,
  User,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  users: Users,
  user: User,
  'users-round': UsersRound,
  'building-2': Building2,
  landmark: Landmark,
  'piggy-bank': PiggyBank,
  wallet: Wallet,
  'book-open': BookOpen,
  calculator: Calculator,
  building: Building,
  settings: Settings,
  inbox: Inbox,
  search: Search,
  'file-bar-chart': FileBarChart,
  package: Package
};

export function NavIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = name ? ICONS[name] : undefined;
  if (!Icon) {
    return <span className={className} aria-hidden />;
  }
  return <Icon className={className} aria-hidden />;
}

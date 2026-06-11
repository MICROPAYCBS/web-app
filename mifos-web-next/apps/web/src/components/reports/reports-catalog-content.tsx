'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import type { FineractReportListItem } from '@mifos/api-client';
import { FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ListPage } from '@/components/composites/list-page';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reportCatalogCategories } from '@/lib/fineract/report-run-display';

export function ReportsCatalogContent({ reports }: { reports: FineractReportListItem[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = useMemo(() => reportCatalogCategories(reports), [reports]);

  const filteredReports = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    return reports.filter((report) => {
      if (!needle) {
        return true;
      }
      return (
        report.reportName.toLowerCase().includes(needle) ||
        (report.reportCategory ?? '').toLowerCase().includes(needle)
      );
    });
  }, [reports, searchQuery]);

  const groupedReports = useMemo(() => {
    const groups: Record<string, FineractReportListItem[]> = {};
    for (const report of filteredReports) {
      const category = report.reportCategory?.trim() || 'Other';
      groups[category] ??= [];
      groups[category].push(report);
    }
    return groups;
  }, [filteredReports]);

  const displayCategories =
    selectedCategory === 'ALL'
      ? Object.keys(groupedReports).sort((a, b) => a.localeCompare(b))
      : groupedReports[selectedCategory]
        ? [selectedCategory]
        : [];

  return (
    <ListPage
      title="Reports"
      description="Browse and run reports configured for your role."
    >
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search reports…"
            className="pl-8"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="ALL" className="rounded-full border px-4 py-1.5">
              All
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="rounded-full border px-4 py-1.5"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {!reports.length ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No reports are available in the user menu yet. Ask an administrator to enable reports
            under System → Report configuration.
          </p>
        ) : null}

        <div className="space-y-8 pb-6">
          {displayCategories.map((category) => (
            <section key={category} className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {groupedReports[category]?.map((report) => (
                  <Link
                    key={report.id}
                    href={`/reports/${report.id}`}
                    className="group block h-full"
                  >
                    <Card className="h-full transition-colors hover:bg-muted/30">
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="rounded-md bg-primary/10 p-2 text-primary">
                            <FileText className="size-4" aria-hidden />
                          </div>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Badge variant="secondary">{report.reportType}</Badge>
                            {report.coreReport ? <Badge variant="outline">Core</Badge> : null}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-base group-hover:text-primary">
                            {report.reportName}
                          </CardTitle>
                          <CardDescription>
                            {report.reportSubType
                              ? `${report.reportType} · ${report.reportSubType}`
                              : report.reportType}
                          </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          {reports.length && !displayCategories.length ? (
            <p className="text-sm text-muted-foreground">No reports match your search.</p>
          ) : null}
        </div>
      </div>
    </ListPage>
  );
}

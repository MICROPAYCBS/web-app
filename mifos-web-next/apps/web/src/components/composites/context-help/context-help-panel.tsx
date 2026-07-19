'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { CircleHelp } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useContextHelp } from '@/components/composites/context-help/context-help-provider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

/** Full-height right sheet — same shell as {@link FormSheet}. */
export function ContextHelpPanel() {
  const { content, open, activeSectionId, setOpen, focusSection } = useContextHelp();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !activeSectionId) {
      return;
    }
    const node = scrollRef.current?.querySelector<HTMLElement>(
      `[data-context-help-section="${activeSectionId}"]`
    );
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [open, activeSectionId]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        id="context-help-panel"
        side="right"
        showCloseButton
        className="flex w-full flex-col gap-0 p-0 data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="shrink-0 space-y-2 border-b border-border">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Context help
          </p>
          <SheetTitle>{content.title}</SheetTitle>
          <SheetDescription className="text-left leading-relaxed">{content.summary}</SheetDescription>
        </SheetHeader>

        <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">On this page</p>
          <nav aria-label="Help topics">
            <ul className="flex flex-col gap-0.5">
              {content.sections.map((section) => {
                const isActive = activeSectionId === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                        isActive
                          ? 'bg-background font-medium text-foreground shadow-xs ring-1 ring-border'
                          : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
                      )}
                      aria-current={isActive ? 'true' : undefined}
                      onClick={() => focusSection(section.id)}
                    >
                      {section.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
        >
          <div className="space-y-3">
            {content.sections.map((section) => {
              const isActive = activeSectionId === section.id;
              return (
                <section
                  key={section.id}
                  data-context-help-section={section.id}
                  className={cn(
                    'scroll-mt-4 rounded-lg border px-3 py-3 transition-colors',
                    isActive
                      ? 'border-border bg-muted/40'
                      : 'border-border/60 bg-background/50'
                  )}
                >
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                  <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-border bg-muted/20 px-4 py-3 sm:flex-col sm:items-start">
          <p className="flex items-start gap-2 text-left text-xs leading-relaxed text-muted-foreground">
            <CircleHelp className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Click the <span className="font-medium text-foreground">?</span> beside a field or
              section on this screen to jump to the matching topic here.
            </span>
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

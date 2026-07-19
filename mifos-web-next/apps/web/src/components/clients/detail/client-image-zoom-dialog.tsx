'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export function ClientImageZoomDialog({
  open,
  onOpenChange,
  src,
  alt
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!open) {
      setScale(1);
    }
  }, [open]);

  function zoomIn() {
    setScale((current) => Math.min(MAX_ZOOM, Number((current + ZOOM_STEP).toFixed(2))));
  }

  function zoomOut() {
    setScale((current) => Math.max(MIN_ZOOM, Number((current - ZOOM_STEP).toFixed(2))));
  }

  function resetZoom() {
    setScale(1);
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    setScale((current) => {
      const next = Number((current + delta).toFixed(2));
      return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{alt}</DialogTitle>
        </DialogHeader>

        <div
          className="flex max-h-[min(80vh,48rem)] items-center justify-center overflow-auto bg-muted/30 p-6"
          onWheel={handleWheel}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            className={cn(
              'max-h-[min(72vh,44rem)] max-w-full origin-center object-contain transition-transform duration-150',
              scale > 1 && 'cursor-grab'
            )}
            style={{ transform: `scale(${scale})` }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 border-t px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={scale <= MIN_ZOOM}
          >
            <ZoomOut className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Reset zoom"
            aria-label="Reset zoom"
            onClick={resetZoom}
            disabled={scale === 1}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={scale >= MAX_ZOOM}
          >
            <ZoomIn className="size-4" />
          </Button>
          <span className="min-w-14 text-center text-xs text-muted-foreground tabular-nums">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { uploadClientSignatureFile } from '@/lib/fineract/upload-client-signature';

const STROKE_WIDTH = 2;
const STROKE_COLOR = '#000000';
const CANVAS_HEIGHT_PX = 200;

function signatureFileFromCanvas(canvas: HTMLCanvasElement): Promise<File | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(new File([blob], 'clientSignature.png', { type: 'image/png' }));
      },
      'image/png'
    );
  });
}

export function ClientSignatureDrawDialog({
  clientId,
  open,
  onOpenChange,
  onSuccess
}: {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = STROKE_WIDTH;
    ctx.strokeStyle = STROKE_COLOR;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setIsEmpty(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    setIsEmpty(true);
    const frame = requestAnimationFrame(initCanvas);
    const container = containerRef.current;
    if (!container) {
      return () => cancelAnimationFrame(frame);
    }
    const observer = new ResizeObserver(() => {
      initCanvas();
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [open, initCanvas]);

  function handleOpenChange(next: boolean) {
    if (pending) {
      return;
    }
    if (!next) {
      setError(null);
      setIsEmpty(true);
    }
    onOpenChange(next);
  }

  function pointerPosition(
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement
  ): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startStroke(x: number, y: number) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function continueStroke(x: number, y: number) {
    if (!drawingRef.current) {
      return;
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function endStroke() {
    drawingRef.current = false;
  }

  function clearPad() {
    initCanvas();
  }

  function handleConfirm() {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const file = await signatureFileFromCanvas(canvas);
      if (!file) {
        setError('Could not save the signature. Try again.');
        return;
      }
      const result = await uploadClientSignatureFile(clientId, file);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      handleOpenChange(false);
      onSuccess();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!pending} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Draw signature</DialogTitle>
          <DialogDescription>
            Sign in the box below. Use Clear to start over.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={containerRef}
          className="mx-auto w-full max-w-[500px] overflow-hidden rounded-md border border-border bg-white"
        >
          <canvas
            ref={canvasRef}
            className="block w-full touch-none"
            style={{ height: CANVAS_HEIGHT_PX }}
            aria-label="Signature drawing area"
            onPointerDown={(e) => {
              if (pending) {
                return;
              }
              e.currentTarget.setPointerCapture(e.pointerId);
              const { x, y } = pointerPosition(e.clientX, e.clientY, e.currentTarget);
              startStroke(x, y);
            }}
            onPointerMove={(e) => {
              if (!drawingRef.current || pending) {
                return;
              }
              const { x, y } = pointerPosition(e.clientX, e.clientY, e.currentTarget);
              continueStroke(x, y);
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
              endStroke();
            }}
            onPointerLeave={() => endStroke()}
            onPointerCancel={() => endStroke()}
          />
        </div>

        <div className="flex justify-center">
          <Button type="button" variant="outline" disabled={pending} onClick={clearPad}>
            Clear
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending || isEmpty} onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export function CaptureClientImageDialog({
  open,
  onOpenChange,
  onCapture
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (dataUrl: string) => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera is not available in this browser.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setCameraError('Camera permission was denied or is unavailable.');
      }
    }
    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open]);

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreview(dataUrl);
    stopCamera();
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPreview(null);
      setError(null);
      setPending(false);
      setCameraError(null);
      stopCamera();
    }
    onOpenChange(next);
  }

  async function handleConfirm() {
    if (!preview) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onCapture(preview);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Capture client photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {cameraError ? (
            <p className="text-sm text-destructive">{cameraError}</p>
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL preview
                <img src={preview} alt="Captured preview" className="size-full object-cover" />
              ) : (
                <video ref={videoRef} className="size-full object-cover" playsInline muted />
              )}
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          {!preview && !cameraError ? (
            <Button type="button" variant="outline" onClick={takePhoto}>
              Take photo
            </Button>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!preview || pending} onClick={handleConfirm}>
            {pending ? 'Saving…' : 'Use photo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

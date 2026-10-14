import * as React from 'react';
import { Camera, ImagePlus, RefreshCw, X } from 'lucide-react';
import type { ImageDTO } from '@shared/types';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const DEFAULT_MAX_FILES = 6;
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

let uploadIdCounter = 0;

function createUploadId(): string {
  uploadIdCounter += 1;
  return `upload-${Date.now()}-${uploadIdCounter}`;
}

function getExtension(name: string): string {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

function formatBytes(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return Number.isInteger(megabytes) ? `${megabytes} MB` : `${megabytes.toFixed(1)} MB`;
}

function validateFile(file: File, maxFileSize: number): string | null {
  if (
    !ACCEPTED_MIME_TYPES.includes(file.type) ||
    !ACCEPTED_EXTENSIONS.includes(getExtension(file.name))
  ) {
    return 'Unsupported format. Use a JPG, PNG or WebP image.';
  }
  if (file.size === 0) {
    return 'This file is empty.';
  }
  if (file.size > maxFileSize) {
    return `Larger than the ${formatBytes(maxFileSize)} limit.`;
  }
  return null;
}

function clampProgress(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

interface UploadItem {
  id: string;
  name: string;
  file: File;
  previewUrl: string;
  progress: number;
  error?: string;
}

export interface ImageUploaderProps {
  value: ImageDTO[];
  onChange: (files: ImageDTO[]) => void;
  uploadFn: (file: File, onProgress?: (pct: number) => void) => Promise<ImageDTO>;
  onRemove?: (image: ImageDTO) => void | Promise<void>;
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  uploadFn,
  onRemove,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const inputId = React.useId();
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const valueRef = React.useRef<ImageDTO[]>(value);
  const itemsRef = React.useRef<UploadItem[]>([]);
  const objectUrlsRef = React.useRef<Set<string>>(new Set());
  const discardedRef = React.useRef<Set<string>>(new Set());

  const [items, setItems] = React.useState<UploadItem[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  React.useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const createPreview = (file: File): string => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  };

  const releasePreview = (url: string): void => {
    if (objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  };

  const runUpload = async (item: UploadItem, file: File): Promise<void> => {
    setItems((previous) =>
      previous.map((current) =>
        current.id === item.id ? { ...current, progress: 0, error: undefined } : current
      )
    );
    try {
      const image = await uploadFn(file, (progress) => {
        setItems((previous) =>
          previous.map((current) =>
            current.id === item.id ? { ...current, progress: clampProgress(progress) } : current
          )
        );
      });

      releasePreview(item.previewUrl);
      setItems((previous) => previous.filter((current) => current.id !== item.id));

      if (discardedRef.current.has(item.id)) {
        discardedRef.current.delete(item.id);
        return;
      }

      const next = [...valueRef.current, image];
      valueRef.current = next;
      onChange(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      setItems((previous) =>
        previous.map((current) =>
          current.id === item.id ? { ...current, progress: 0, error: message } : current
        )
      );
    }
  };

  const handleFiles = (fileList: FileList | null): void => {
    if (!fileList || disabled) return;

    const files = Array.from(fileList);
    const nextErrors: string[] = [];
    const accepted: { file: File; item: UploadItem }[] = [];
    const usedCount = valueRef.current.length + itemsRef.current.length;

    for (const file of files) {
      const message = validateFile(file, maxFileSize);
      if (message) {
        nextErrors.push(`${file.name}: ${message}`);
        continue;
      }
      if (usedCount + accepted.length >= maxFiles) {
        nextErrors.push(`${file.name}: you can upload up to ${maxFiles} images.`);
        continue;
      }
      accepted.push({
        file,
        item: {
          id: createUploadId(),
          name: file.name,
          file,
          previewUrl: createPreview(file),
          progress: 0,
        },
      });
    }

    if (accepted.length > 0) {
      setItems((previous) => [...previous, ...accepted.map((entry) => entry.item)]);
      accepted.forEach((entry) => {
        void runUpload(entry.item, entry.file);
      });
    }

    setErrors(nextErrors);
  };

  const removePending = (id: string): void => {
    discardedRef.current.add(id);
    const target = itemsRef.current.find((current) => current.id === id);
    if (target) releasePreview(target.previewUrl);
    setItems((previous) => previous.filter((current) => current.id !== id));
  };

  const retryUpload = (id: string): void => {
    const target = itemsRef.current.find((current) => current.id === id);
    if (target) void runUpload(target, target.file);
  };

  const removeImage = (index: number): void => {
    const target = valueRef.current[index];
    const next = valueRef.current.filter((_, currentIndex) => currentIndex !== index);
    valueRef.current = next;
    onChange(next);
    if (target && onRemove) void onRemove(target);
  };

  const usedCount = value.length + items.length;
  const canAdd = !disabled && usedCount < maxFiles;

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {canAdd ? (
        <button
          type="button"
          disabled={disabled}
          aria-label="Upload images"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            if (disabled) return;
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            if (disabled) return;
            handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
            isDragging
              ? 'border-primary bg-accent/60'
              : 'border-input hover:border-primary/50 hover:bg-accent/40',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">
            Drag &amp; drop images here, or click to browse
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG or WebP · up to {formatBytes(maxFileSize)} · {usedCount}/{maxFiles}
          </span>
        </button>
      ) : null}

      {canAdd ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => cameraInputRef.current?.click()}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50 sm:hidden"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          Take a photo
        </button>
      ) : null}

      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((image, index) => (
            <li key={`${image.url}-${index}`} className="space-y-1">
              <div className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                <img
                  src={image.thumbnailUrl ?? image.url}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                {!disabled ? (
                  <button
                    type="button"
                    aria-label={`Remove image ${index + 1}`}
                    onClick={() => removeImage(index)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-navy/80 text-navy-foreground opacity-100 transition-opacity hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="space-y-1.5">
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="h-full w-full object-cover opacity-70"
                />
                <button
                  type="button"
                  aria-label={`Cancel upload of ${item.name}`}
                  onClick={() => removePending(item.id)}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-navy/80 text-navy-foreground transition-colors hover:bg-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="absolute inset-x-0 bottom-0 bg-navy/70 p-2">
                  <Progress
                    value={item.progress}
                    aria-label={`Uploading ${item.name}`}
                    className="h-1.5 bg-background/30"
                    indicatorClassName="bg-accent"
                  />
                </div>
              </div>
              <p className="truncate text-xs text-muted-foreground">{item.name}</p>
              {item.error ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-destructive">{item.error}</p>
                  <button
                    type="button"
                    onClick={() => retryUpload(item.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {errors.length > 0 ? (
        <ul role="alert" className="space-y-1">
          {errors.map((message) => (
            <li key={message} className="text-xs font-medium text-destructive">
              {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { ImageUploader as ImageUpload };
export type ImageUploadProps = ImageUploaderProps;

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ImageDTO } from '@shared/types';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ImageGalleryProps {
  images: ImageDTO[];
  className?: string;
  altPrefix?: string;
}

export function ImageGallery({ images, className, altPrefix = 'Material' }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (images.length === 0) return null;

  const isOpen = activeIndex !== null;
  const current = activeIndex !== null ? images[activeIndex] : undefined;

  const showPrevious = () =>
    setActiveIndex((index) => (index === null ? index : (index - 1 + images.length) % images.length));
  const showNext = () =>
    setActiveIndex((index) => (index === null ? index : (index + 1) % images.length));

  return (
    <>
      <ul className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}>
        {images.map((image, index) => (
          <li key={`${image.publicId ?? image.url}-${index}`}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View ${altPrefix.toLowerCase()} image ${index + 1} of ${images.length}`}
              className="group block w-full overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={image.thumbnailUrl ?? image.url}
                alt={`${altPrefix} ${index + 1}`}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={isOpen} onOpenChange={(open) => !open && setActiveIndex(null)}>
        <DialogContent className="max-w-4xl bg-navy/95 p-2 sm:max-w-4xl">
          <DialogTitle className="sr-only">
            {altPrefix} image {activeIndex !== null ? activeIndex + 1 : 0} of {images.length}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Use the previous and next buttons to browse the uploaded images.
          </DialogDescription>

          {current ? (
            <div
              className="relative flex items-center justify-center"
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') showPrevious();
                if (event.key === 'ArrowRight') showNext();
              }}
              tabIndex={-1}
            >
              <img
                src={current.url}
                alt={`${altPrefix} ${activeIndex! + 1}`}
                className="max-h-[80vh] w-full rounded-md object-contain"
              />

              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-navy/80 px-3 py-1 text-xs font-medium text-navy-foreground">
                    {activeIndex! + 1} / {images.length}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

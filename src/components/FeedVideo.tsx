"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type FeedVideoProps = {
  src: string;
};

export default function FeedVideo({
  src,
}: FeedVideoProps) {
  const videoRef =
    useRef<HTMLVideoElement | null>(null);

  const [muted, setMuted] =
    useState(true);

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video) {
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting &&
            entry.intersectionRatio >= 0.6
          ) {
            void video.play().catch(() => {
              // Browser may block autoplay.
            });

            return;
          }

          video.pause();
        },
        {
          threshold: [0, 0.6, 1],
        },
      );

    observer.observe(video);

    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        playsInline
        loop
        preload="metadata"
        controls
        className="max-h-[560px] w-full object-contain sm:max-h-[460px]"
      />

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();

          const nextMuted =
            !muted;

          setMuted(nextMuted);

          if (videoRef.current) {
            videoRef.current.muted =
              nextMuted;
          }
        }}
        aria-label={
          muted
            ? "Turn sound on"
            : "Mute video"
        }
        className="pointer-events-auto absolute bottom-12 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-sm text-white backdrop-blur transition hover:bg-black/80"
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}
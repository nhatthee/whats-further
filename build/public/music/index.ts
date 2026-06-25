"use client";

import Container from "@/components/Container";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Swap to "wide-gap" to compare a second variant with extra separation. */
const REPLAY_ICON_VARIANT: "tuned" | "wide-gap" = "tuned";

function ReplayIcon({ variant = REPLAY_ICON_VARIANT }: { variant?: "tuned" | "wide-gap" }) {
  const arcPath =
    variant === "wide-gap"
      ? "M13.45 6.45C15.7 5.85 18.5 8.4 18.5 12C18.5 15.6 15.6 18.5 12 18.5C8.4 18.5 6.05 15.3 6.05 12.35"
      : "M13.05 6C15.6 5.5 18.5 8.4 18.5 12C18.5 15.6 15.6 18.5 12 18.5C8.4 18.5 5.75 15.5 5.75 12.15";

  const arrowPath =
    variant === "wide-gap"
      ? "M12 2.8L8.4 6.1L12 10.55"
      : "M12 2.8L8.4 6.1L12 10.05";

  return (
    <svg
      className="h-[22px] w-[22px] text-white"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={arcPath}
        stroke="currentColor"
        strokeWidth="3.25"
        strokeLinecap="round"
      />
      <path
        d={arrowPath}
        stroke="currentColor"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SLIDE_DURATION_MS = 4000;
const FADE_DURATION_MS = 1600;
const MIN_SCALE = 1.035;
const MAX_SCALE = 1.12;

const desktopSlides = [
  {
    image: "/images/hero/beyond-prescription.webp",
    title: "Beyond",
    suffix: "The Prescription.",
    backgroundWord: "PRESCRIPTION",
    kicker: "Not just medication.",
    story: "A more personal way to begin care.",
  },
  {
    image: "/images/hero/beyond-yourself.webp",
    title: "Beyond",
    suffix: "Yourself.",
    backgroundWord: "YOURSELF",
    kicker: "Health that reaches further.",
    story: "The people you love feel it too.",
  },
  {
    image: "/images/hero/beyond-what-you-gain.webp",
    title: "Beyond",
    suffix: "What You Gain.",
    backgroundWord: "GAIN",
    kicker: "More than results.",
    story: "The value of health grows when it's shared.",
  },
  {
    image: "/images/hero/beyond-health.webp",
    title: "Forged",
    suffix: "Around You.",
    backgroundWord: "FORGED",
    kicker: "Seamlessly connected.",
    story: "Care designed around your life, not the other way around.",
  },
];

const mobileSlides = [
  {
    image: "/images/hero/mobile/beyond-prescription-mobile.webp",
    title: "Beyond",
    suffix: "The Prescription.",
    backgroundWord: "PRESCRIPTION",
    kicker: "Not just medication.",
    story: "A more personal way to begin care.",
  },
  {
    image: "/images/hero/mobile/beyond-yourself-mobile.webp",
    title: "Beyond",
    suffix: "Yourself.",
    backgroundWord: "YOURSELF",
    kicker: "Health that reaches further.",
    story: "The people you love feel it too.",
  },
  {
    image: "/images/hero/mobile/beyond-what-you-gain-mobile.webp",
    title: "Beyond",
    suffix: "What You Gain.",
    backgroundWord: "GAIN",
    kicker: "More than results.",
    story: "The value of health grows when it's shared.",
  },
  {
    image: "/images/hero/mobile/beyond-health-mobile.webp",
    title: "Forged",
    suffix: "Around You.",
    backgroundWord: "FORGED",
    kicker: "Seamlessly connected.",
    story: "Care designed around your life, not the other way around.",
  },
];

export default function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  const [previousImage, setPreviousImage] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [zoomProgress, setZoomProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const activeSlide = desktopSlides[currentImage];

  const handleControlClick = () => {
    if (isFinished) {
      setCurrentImage(0);
      setPreviousImage(null);
      setZoomProgress(0);
      setIsFinished(false);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsFinished(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    [...desktopSlides.slice(1), ...mobileSlides.slice(1)].forEach((slide) => {
      const img = new window.Image();
      img.src = slide.image;
    });
  }, []);

  useEffect(() => {
    if (!isPlaying || isFinished) {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      lastFrameTimeRef.current = null;
      return;
    }

    const animateZoom = (time: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
      }

      const delta = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;

      setZoomProgress((current) => {
        const next = current + delta / SLIDE_DURATION_MS;
        return Math.min(next, 1);
      });

      animationFrameRef.current = window.requestAnimationFrame(animateZoom);
    };

    animationFrameRef.current = window.requestAnimationFrame(animateZoom);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, isFinished]);

  useEffect(() => {
    if (!isPlaying || isFinished || zoomProgress < 1) return;

    if (currentImage >= desktopSlides.length - 1) {
      setIsPlaying(false);
      setIsFinished(true);
      return;
    }

    setPreviousImage(currentImage);
    setCurrentImage(currentImage + 1);
    setZoomProgress(0);
  }, [zoomProgress, isPlaying, isFinished, currentImage]);

  useEffect(() => {
    if (previousImage === null) return;

    const timeoutId = window.setTimeout(() => {
      setPreviousImage(null);
    }, FADE_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [previousImage]);

  const currentScale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * zoomProgress;

  const renderSlides = (slides: typeof desktopSlides) =>
    slides.map((slide, index) => {
      const isActive = currentImage === index;
      const isPrevious = previousImage === index;
      const isVisible = isActive || isPrevious;

      return (
        <div
          key={slide.image}
          aria-hidden={!isVisible}
          className={`absolute inset-0 transition-opacity duration-[1600ms] ease-[cubic-bezier(0.45,0,0.15,1)] ${
            isActive
              ? "z-20 opacity-100"
              : isPrevious
                ? "z-10 opacity-0"
                : "z-0 opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 transform-gpu will-change-transform"
            style={{
              transform: isActive
                ? `scale(${currentScale})`
                : isPrevious
                  ? `scale(${MAX_SCALE})`
                  : `scale(${MIN_SCALE})`,
            }}
          >
            <Image
              src={slide.image}
              alt="FORGEMEDS Hero"
              fill
              priority={index === 0}
              fetchPriority={index === 0 ? "high" : "auto"}
              quality={100}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      );
    });

  return (
    <>
      <style jsx>{`
        .hero-section {
          background-image: url('/images/hero/mobile/beyond-prescription-mobile.webp');
          background-size: cover;
          background-position: center;
        }

        @media (min-width: 768px) {
          .hero-section {
            background-image: url('/images/hero/beyond-prescription.webp');
            background-position: 72% center;
          }
        }
      `}</style>
      <section className="hero-section relative flex w-full min-h-[90svh] flex-col overflow-hidden bg-[#1A130F] bg-cover bg-center pt-20 text-white md:min-h-[95vh] md:justify-center md:pt-0 lg:min-h-screen">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 block md:hidden">
          {renderSlides(mobileSlides)}
        </div>

        <div className="absolute inset-0 hidden md:block">
          {renderSlides(desktopSlides)}
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 bg-[#1A130F]/20" />

        <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,rgba(231,193,127,0.16),transparent_62%)]" />

        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(26,19,15,0.18)_0%,rgba(26,19,15,0.06)_42%,rgba(26,19,15,0.28)_100%)]" />
      </div>

      <Container className="relative z-10 flex flex-1 items-center justify-center text-center font-sans">
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <p
            key={`background-word-desktop-${activeSlide.backgroundWord}-${currentImage}`}
            className="pointer-events-none absolute left-1/2 top-[52%] z-0 hidden -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[24vw] font-semibold uppercase leading-none tracking-[-0.1em] text-white/[0.04] blur-[1px] md:block"
          >
            {activeSlide.backgroundWord}
          </p>

          <p
            key={`background-word-mobile-${activeSlide.backgroundWord}-${currentImage}`}
            className="pointer-events-none absolute left-1/2 top-[52%] z-0 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[28vw] font-semibold uppercase leading-none tracking-[-0.1em] text-white/[0.03] blur-[1px] md:hidden"
          >
            {activeSlide.backgroundWord}
          </p>

          <h1 className="overflow-hidden text-center text-white">
            <span
              key={`title-${activeSlide.title}-${currentImage}`}
              className="block whitespace-nowrap animate-[hero-title-left_950ms_cubic-bezier(0.16,1,0.3,1)_both] text-[27px] font-extralight leading-[0.86] tracking-[-0.07em] sm:text-[35px] md:text-[52px] lg:text-[64px]"
            >
              {activeSlide.title}
            </span>

            <span
              key={`suffix-${activeSlide.suffix}-${currentImage}`}
              className="mt-1 block whitespace-nowrap animate-[hero-title-right_1100ms_cubic-bezier(0.16,1,0.3,1)_both] text-[38px] font-light leading-[0.9] tracking-[-0.06em] sm:text-[50px] md:text-[74px] lg:text-[92px]"
            >
              {activeSlide.suffix}
            </span>
          </h1>

          <div
            key={`cinematic-copy-${activeSlide.kicker}-${currentImage}`}
            className="mx-auto mt-7 max-w-[620px] animate-[hero-copy-fade_1200ms_ease-out_350ms_both] text-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#e7c17f] md:text-xs">
              {activeSlide.kicker}
            </p>

            <p className="mx-auto mt-3 max-w-[520px] text-sm font-light leading-relaxed tracking-[0.04em] text-white/78 md:text-base">
              {activeSlide.story}
            </p>
          </div>
        </div>
      </Container>

      <button
        type="button"
        onClick={handleControlClick}
        aria-label={
          isFinished
            ? "Replay hero slideshow"
            : isPlaying
              ? "Pause hero slideshow"
              : "Play hero slideshow"
        }
        className="absolute bottom-6 right-6 z-40 flex h-9 w-9 items-center justify-center rounded-full bg-[#2F2F31]/85 text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] backdrop-blur-xl transition-all duration-300 hover:scale-105"
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          {isFinished ? (
            <ReplayIcon />
          ) : isPlaying ? (
            <span className="flex gap-[4px]">
  <span className="h-3 w-[3px] rounded-full bg-white" />
  <span className="h-3 w-[3px] rounded-full bg-white" />
</span>
          ) : (
            <span className="ml-[2px] h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-white" />
          )}
        </span>
      </button>
    </section>
    </>
  );
}

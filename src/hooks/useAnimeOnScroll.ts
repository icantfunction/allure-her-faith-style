import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

export const useAnimeOnScroll = <T extends HTMLElement = HTMLDivElement>(
  animationConfig: anime.AnimeParams,
  options: { threshold?: number; triggerOnce?: boolean } = {}
) => {
  const elementRef = useRef<T>(null);
  const { threshold = 0.1, triggerOnce = true } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: element,
              ...animationConfig,
            });
            
            if (triggerOnce) {
              observer.unobserve(element);
            }
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [animationConfig, threshold, triggerOnce]);

  return elementRef;
};

export const useAnimeSequence = <T extends HTMLElement = HTMLDivElement>(sequence: anime.AnimeParams[]) => {
  const elementRef = useRef<T>(null);

  const playSequence = () => {
    if (!elementRef.current) return;

    const timeline = anime.timeline({
      autoplay: false,
    });

    sequence.forEach((config, index) => {
      timeline.add({
        targets: elementRef.current,
        ...config,
      }, index === 0 ? 0 : `+=${config.delay || 0}`);
    });

    timeline.play();
  };

  return { elementRef, playSequence };
};
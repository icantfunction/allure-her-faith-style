import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

export const useAnimeOnScroll = <T extends HTMLElement = HTMLDivElement>(
  animationConfig: any,
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
            animate(element, animationConfig);
            
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

export const useAnimeSequence = <T extends HTMLElement = HTMLDivElement>(sequence: any[]) => {
  const elementRef = useRef<T>(null);

  const playSequence = () => {
    if (!elementRef.current) return;

    sequence.forEach((config, index) => {
      setTimeout(() => {
        animate(elementRef.current, config);
      }, index * (config.delay || 100));
    });
  };

  return { elementRef, playSequence };
};
import { useCallback } from 'react';
import { animate, stagger } from 'animejs';

export const useProductGridAnimations = () => {
  // Animate products leaving (when filter changes)
  const animateProductsOut = useCallback((elements: HTMLElement[]) => {
    return animate(elements, {
      scale: [1, 0.9],
      opacity: [1, 0],
      duration: 200,
      easing: 'easeInQuart',
    });
  }, []);

  // Animate products entering (new filter results)
  const animateProductsIn = useCallback((elements: HTMLElement[]) => {
    return animate(elements, {
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 250,
      delay: stagger(60),
      easing: 'easeOutQuart',
    });
  }, []);

  // Initial grid reveal on page load
  const animateGridReveal = useCallback((elements: HTMLElement[]) => {
    return animate(elements, {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.95, 1],
      duration: 250,
      delay: stagger(60),
      easing: 'easeOutQuart',
    });
  }, []);

  return {
    animateProductsOut,
    animateProductsIn,
    animateGridReveal,
  };
};

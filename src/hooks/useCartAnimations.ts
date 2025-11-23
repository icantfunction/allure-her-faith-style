import { useCallback } from 'react';
import { animate } from 'animejs';

export const useCartAnimations = () => {
  // Button tap animation with springy feel
  const animateButtonTap = useCallback((element: HTMLElement) => {
    return animate(element, {
      scale: [1, 0.95, 1],
      duration: 180,
      easing: 'easeOutBack',
    });
  }, []);

  // Cart icon bounce/wiggle
  const animateCartIcon = useCallback((element: HTMLElement) => {
    return animate(element, {
      translateY: [0, -8, 0],
      scale: [1, 1.1, 1],
      duration: 400,
      easing: 'easeOutElastic(1, .6)',
    });
  }, []);

  // Checkmark SVG path draw animation
  const animateCheckmark = useCallback((element: SVGPathElement) => {
    const length = element.getTotalLength();
    // Set initial state
    element.style.strokeDasharray = `${length}`;
    element.style.strokeDashoffset = `${length}`;
    
    return animate(element, {
      strokeDashoffset: [length, 0],
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutQuart',
    });
  }, []);

  // Success feedback animation (scale up then down)
  const animateSuccess = useCallback((element: HTMLElement) => {
    return animate(element, {
      scale: [0, 1.2, 1],
      opacity: [0, 1, 1],
      duration: 400,
      easing: 'easeOutBack',
    });
  }, []);

  return {
    animateButtonTap,
    animateCartIcon,
    animateCheckmark,
    animateSuccess,
  };
};

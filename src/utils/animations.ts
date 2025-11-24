import { animate, stagger } from 'animejs';

export const fadeInUp = {
  opacity: [0, 1],
  translateY: [30, 0],
  duration: 800,
  easing: 'easeOutCubic',
};

export const scaleIn = {
  scale: [0.9, 1],
  opacity: [0, 1],
  duration: 500,
  easing: 'easeOutBack',
};

export const textReveal = {
  opacity: [0, 1],
  translateY: [50, 0],
  duration: 1000,
  delay: stagger(50, { from: 300 }),
  easing: 'easeOutExpo',
};

export const breathingAnimation = (element: HTMLElement) => {
  animate(element, {
    scale: [1, 1.02, 1],
    duration: 3000,
    loop: true,
    easing: 'easeInOutSine',
  });
};

export const floatingElements = (element: HTMLElement) => {
  animate(element, {
    translateY: [-5, 5],
    duration: 4000,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });
};

export const scriptureGlow = (element: HTMLElement) => {
  animate(element, {
    filter: [
      'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))',
      'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))',
      'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))'
    ],
    duration: 2000,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });
};

// Shopping Section Animations

// Product grid reveal with optimized stagger timing
export const productGridReveal = {
  opacity: [0, 1],
  translateY: [30, 0],
  scale: [0.95, 1],
  duration: 250,
  delay: stagger(60),
  easing: 'easeOutQuart',
};

// Filter transition - items leaving
export const filterFadeOut = {
  scale: [1, 0.9],
  opacity: [1, 0],
  duration: 200,
  easing: 'easeInQuart',
};

// Filter transition - new items entering
export const filterFadeIn = {
  scale: [0.9, 1],
  opacity: [0, 1],
  duration: 250,
  delay: stagger(60),
  easing: 'easeOutQuart',
};

// Add-to-cart button tap animation
export const addToCartTap = (element: HTMLElement) => {
  return animate(element, {
    scale: [1, 0.95, 1],
    duration: 180,
    easing: 'easeOutBack',
  });
};

// Cart icon bounce animation
export const cartBounce = (element: HTMLElement) => {
  return animate(element, {
    translateY: [0, -8, 0],
    scale: [1, 1.1, 1],
    duration: 400,
    easing: 'easeOutElastic(1, .6)',
  });
};

// Checkmark draw-in animation (for SVG paths)
export const checkmarkDraw = (element: SVGPathElement) => {
  const length = element.getTotalLength();
  return animate(element, {
    strokeDashoffset: [length, 0],
    opacity: [0, 1],
    duration: 300,
    easing: 'easeOutQuart',
  });
};

// Hero section staggered reveal
export const heroSectionReveal = {
  opacity: [0, 1],
  translateY: [40, 0],
  duration: 600,
  delay: stagger(150),
  easing: 'easeOutQuart',
};

// Featured categories side-to-side reveal
export const featuredCategoriesReveal = {
  opacity: [0, 1],
  translateX: [-30, 0],
  duration: 500,
  delay: stagger(80),
  easing: 'easeOutQuart',
};

// Testimonial cards scroll reveal
export const testimonialReveal = {
  opacity: [0, 1],
  scale: [0.95, 1],
  translateY: [20, 0],
  duration: 400,
  delay: stagger(100),
  easing: 'easeOutQuart',
};
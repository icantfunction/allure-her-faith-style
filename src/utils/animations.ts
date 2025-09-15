import { animate, stagger } from 'animejs';

export const fadeInUp = {
  opacity: [0, 1],
  y: [30, 0],
  duration: 800,
  ease: 'outCubic',
};

export const staggeredFadeIn = {
  opacity: [0, 1],
  y: [20, 0],
  duration: 600,
  delay: stagger(100),
  ease: 'outQuart',
};

export const scaleIn = {
  scale: [0.9, 1],
  opacity: [0, 1],
  duration: 500,
  ease: 'outBack',
};

export const textReveal = {
  opacity: [0, 1],
  y: [50, 0],
  duration: 1000,
  delay: stagger(50, { from: 300 }),
  ease: 'outExpo',
};

export const breathingAnimation = (element: HTMLElement) => {
  animate(element, {
    scale: [1, 1.02, 1],
    duration: 3000,
    loop: true,
    ease: 'inOutSine',
  });
};

export const floatingElements = (element: HTMLElement) => {
  animate(element, {
    y: [-5, 5],
    duration: 4000,
    direction: 'alternate',
    loop: true,
    ease: 'inOutSine',
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
    ease: 'inOutSine',
  });
};
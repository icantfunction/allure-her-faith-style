import anime from 'animejs/lib/anime.es.js';

export const fadeInUp = {
  opacity: [0, 1],
  translateY: [30, 0],
  duration: 800,
  easing: 'easeOutCubic',
};

export const staggeredFadeIn = {
  opacity: [0, 1],
  translateY: [20, 0],
  duration: 600,
  delay: anime.stagger(100),
  easing: 'easeOutQuart',
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
  delay: anime.stagger(50, { start: 300 }),
  easing: 'easeOutExpo',
};

export const breathingAnimation = (element: HTMLElement) => {
  anime({
    targets: element,
    scale: [1, 1.02, 1],
    duration: 3000,
    loop: true,
    easing: 'easeInOutSine',
  });
};

export const floatingElements = (element: HTMLElement) => {
  anime({
    targets: element,
    translateY: [-5, 5],
    duration: 4000,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });
};

export const scriptureGlow = (element: HTMLElement) => {
  anime({
    targets: element,
    textShadow: [
      '0 0 5px rgba(212, 175, 55, 0.3)',
      '0 0 10px rgba(212, 175, 55, 0.5)',
      '0 0 5px rgba(212, 175, 55, 0.3)'
    ],
    duration: 2000,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  });
};
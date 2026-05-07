import { useEffect, useRef } from 'react';

/**
 * Hook that adds a `.visible` class to elements when they enter the viewport.
 * Usage: const ref = useAnimateOnScroll(); then <div ref={ref} className="animate-on-scroll">
 */
export default function useAnimateOnScroll(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -40px 0px',
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return ref;
}

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const usePageLoadAnimation = () => {
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const subheaderRef = useRef(null);
  const cardsRef = useRef([]);
  const buttonsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states to avoid reflow
      gsap.set(headerRef.current, { y: 30, opacity: 0, willChange: 'transform, opacity' });
      gsap.set(subheaderRef.current, { y: 20, opacity: 0, willChange: 'transform, opacity' });
      gsap.set(cardsRef.current, { y: 50, opacity: 0, willChange: 'transform, opacity' });
      gsap.set(buttonsRef.current, { scale: 0.9, opacity: 0, willChange: 'transform, opacity' });

      // Animate page header
      gsap.to(headerRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => gsap.set(headerRef.current, { willChange: 'auto' })
      });

      gsap.to(subheaderRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        delay: 0.2,
        ease: 'power2.out',
        onComplete: () => gsap.set(subheaderRef.current, { willChange: 'auto' })
      });

      // Animate cards with stagger
      gsap.to(cardsRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.4,
        ease: 'power2.out',
        onComplete: () => gsap.set(cardsRef.current, { willChange: 'auto' })
      });

      // Animate buttons
      gsap.to(buttonsRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        delay: 0.6,
        ease: 'back.out(1.7)',
        onComplete: () => gsap.set(buttonsRef.current, { willChange: 'auto' })
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return { containerRef, headerRef, subheaderRef, cardsRef, buttonsRef };
};

export const useModalAnimation = (isOpen) => {
  const modalRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!modalRef.current || !backdropRef.current) return;

    if (isOpen) {
      // Animate modal in
      gsap.set([modalRef.current, backdropRef.current], { display: 'block' });

      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );

      gsap.fromTo(modalRef.current,
        { scale: 0.7, opacity: 0, y: 50 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' }
      );
    } else {
      // Animate modal out
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set([modalRef.current, backdropRef.current], { display: 'none' });
        }
      });

      tl.to(modalRef.current, {
        scale: 0.7,
        opacity: 0,
        y: 50,
        duration: 0.3,
        ease: 'power2.in'
      })
      .to(backdropRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      }, 0);
    }
  }, [isOpen]);

  return { modalRef, backdropRef };
};

export const useTableRowAnimation = () => {
  const animateRow = (rowElement, index) => {
    gsap.fromTo(rowElement,
      { x: -50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.4,
        delay: index * 0.05,
        ease: 'power2.out'
      }
    );
  };

  const animateRowHover = (rowElement, isHover) => {
    gsap.to(rowElement, {
      scale: isHover ? 1.02 : 1,
      duration: 0.2,
      ease: 'power2.out'
    });
  };

  return { animateRow, animateRowHover };
};

export const useButtonClickAnimation = () => {
  const animateClick = (buttonElement) => {
    const tl = gsap.timeline();

    tl.to(buttonElement, {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.in'
    })
    .to(buttonElement, {
      scale: 1,
      duration: 0.2,
      ease: 'back.out(1.7)'
    });
  };

  return { animateClick };
};

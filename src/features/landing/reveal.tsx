'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface RevealProps {
    children: ReactNode;
    className?: string;
    delay?: 'none' | 'short' | 'medium' | 'long';
}

const DELAY_CLASSES: Record<NonNullable<RevealProps['delay']>, string> = {
    none: '',
    short: 'delay-100',
    medium: 'delay-200',
    long: 'delay-300',
};

export function Reveal({ children, className, delay = 'none' }: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;

        if (!node) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(node);
                }
            },
            {
                rootMargin: '0px 0px -12% 0px',
                threshold: 0.16,
            },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={cn(
                'transform-gpu transition-all duration-700 ease-out will-change-transform motion-reduce:transition-none',
                DELAY_CLASSES[delay],
                isVisible
                    ? 'translate-y-0 opacity-100 blur-none'
                    : 'translate-y-6 opacity-0 blur-sm',
                className,
            )}
        >
            {children}
        </div>
    );
}

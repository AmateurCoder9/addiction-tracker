"use client";

import { useEffect, useRef } from "react";

export function useScrollReveal<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                    }
                }
            },
            { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return ref;
}

export function useScrollRevealAll() {
    useEffect(() => {
        const elements = document.querySelectorAll(
            ".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right"
        );

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                    }
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);
}

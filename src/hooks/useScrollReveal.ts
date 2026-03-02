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
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                    }
                }
            },
            { threshold: 0.05, rootMargin: "0px 0px -30px 0px" }
        );

        function observeAll() {
            const elements = document.querySelectorAll(
                ".scroll-reveal:not(.visible), .scroll-reveal-left:not(.visible), .scroll-reveal-right:not(.visible)"
            );
            elements.forEach((el) => observer.observe(el));
        }

        // Run immediately
        observeAll();
        // Run again after render settles
        const t1 = setTimeout(observeAll, 100);
        const t2 = setTimeout(observeAll, 500);

        // Watch for new elements
        const mutation = new MutationObserver(observeAll);
        mutation.observe(document.body, { childList: true, subtree: true });

        return () => { observer.disconnect(); mutation.disconnect(); clearTimeout(t1); clearTimeout(t2); };
    }, []);
}

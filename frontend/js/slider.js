/* =========================================================
   SPORTING — HERO SLIDER
   10 Slides
   Auto Change: 2 Seconds
   Direction: Right to Left
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initializeSlider();
});


function initializeSlider() {

    const slider =
        document.querySelector(".hero-slider") ||
        document.querySelector(".slider");

    if (!slider) {
        return;
    }


    const slides =
        Array.from(
            slider.querySelectorAll(
                ".slide, .hero-slide"
            )
        );


    if (slides.length <= 1) {
        return;
    }


    const dots =
        Array.from(
            document.querySelectorAll(
                ".hero-dot, .slider-dot, .hero-dots button"
            )
        );


    let currentIndex = 0;
    let isAnimating = false;
    let autoplayTimer = null;

    const AUTOPLAY_TIME = 2000;
    const TRANSITION_TIME = 700;


    /* =====================================================
       PREPARE SLIDES
       ===================================================== */

    slides.forEach((slide, index) => {

        slide.classList.remove(
            "active",
            "previous",
            "next"
        );

        if (index === 0) {
            slide.classList.add("active");
        }

    });


    updateDots();


    /* =====================================================
       GO TO SLIDE
       ===================================================== */

    function goToSlide(
        targetIndex,
        direction = "next"
    ) {

        if (isAnimating) {
            return;
        }

        if (targetIndex === currentIndex) {
            return;
        }


        isAnimating = true;


        const currentSlide =
            slides[currentIndex];

        const targetSlide =
            slides[targetIndex];


        /* Remove old state */

        slides.forEach(slide => {

            slide.classList.remove(
                "active",
                "previous",
                "next"
            );

        });


        /*
         * For a right-to-left transition:
         *
         * Current slide moves left.
         * New slide enters from the right.
         */

        if (direction === "next") {

            currentSlide.classList.add(
                "previous"
            );

            targetSlide.classList.add(
                "next"
            );

        } else {

            currentSlide.classList.add(
                "next"
            );

            targetSlide.classList.add(
                "previous"
            );

        }


        /* Force browser to process initial position */

        void targetSlide.offsetWidth;


        requestAnimationFrame(() => {

            currentSlide.classList.add(
                "slide-leaving"
            );

            targetSlide.classList.add(
                "slide-entering"
            );

        });


        setTimeout(() => {

            slides.forEach(slide => {

                slide.classList.remove(
                    "active",
                    "previous",
                    "next",
                    "slide-leaving",
                    "slide-entering"
                );

            });


            targetSlide.classList.add(
                "active"
            );


            currentIndex =
                targetIndex;


            updateDots();

            isAnimating = false;

        }, TRANSITION_TIME);

    }


    /* =====================================================
       NEXT SLIDE
       ===================================================== */

    function nextSlide() {

        const nextIndex =
            (currentIndex + 1) %
            slides.length;

        goToSlide(
            nextIndex,
            "next"
        );

    }


    /* =====================================================
       PREVIOUS SLIDE
       ===================================================== */

    function previousSlide() {

        const previousIndex =
            (
                currentIndex -
                1 +
                slides.length
            ) %
            slides.length;

        goToSlide(
            previousIndex,
            "previous"
        );

    }


    /* =====================================================
       DOTS
       ===================================================== */

    function updateDots() {

        if (!dots.length) {
            return;
        }


        dots.forEach(
            (dot, index) => {

                dot.classList.toggle(
                    "active",
                    index === currentIndex
                );


                dot.setAttribute(
                    "aria-current",
                    index === currentIndex
                        ? "true"
                        : "false"
                );

            }
        );

    }


    dots.forEach(
        (dot, index) => {

            dot.addEventListener(
                "click",
                () => {

                    const direction =
                        index > currentIndex
                            ? "next"
                            : "previous";


                    goToSlide(
                        index,
                        direction
                    );


                    restartAutoplay();

                }
            );

        }
    );


    /* =====================================================
       AUTOPLAY
       ===================================================== */

    function startAutoplay() {

        stopAutoplay();


        autoplayTimer =
            setInterval(
                () => {

                    nextSlide();

                },
                AUTOPLAY_TIME
            );

    }


    function stopAutoplay() {

        if (autoplayTimer !== null) {

            clearInterval(
                autoplayTimer
            );

            autoplayTimer = null;

        }

    }


    function restartAutoplay() {

        startAutoplay();

    }


    /* =====================================================
       PAUSE WHEN USER HOVERS
       ===================================================== */

    slider.addEventListener(
        "mouseenter",
        () => {

            stopAutoplay();

        }
    );


    slider.addEventListener(
        "mouseleave",
        () => {

            startAutoplay();

        }
    );


    /* =====================================================
       KEYBOARD CONTROLS
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            /*
             * Do not interfere with typing
             * into forms or inputs.
             */

            const activeElement =
                document.activeElement;

            const isTyping =
                activeElement &&
                (
                    activeElement.tagName ===
                        "INPUT" ||

                    activeElement.tagName ===
                        "TEXTAREA" ||

                    activeElement.tagName ===
                        "SELECT"
                );


            if (isTyping) {
                return;
            }


            if (event.key === "ArrowRight") {

                nextSlide();

                restartAutoplay();

            }


            if (event.key === "ArrowLeft") {

                previousSlide();

                restartAutoplay();

            }

        }
    );


    /* =====================================================
       TOUCH / SWIPE SUPPORT
       ===================================================== */

    let touchStartX = 0;
    let touchEndX = 0;


    slider.addEventListener(
        "touchstart",
        event => {

            if (
                !event.touches ||
                !event.touches.length
            ) {
                return;
            }


            touchStartX =
                event.touches[0].clientX;

            touchEndX =
                touchStartX;

            stopAutoplay();

        },
        {
            passive: true
        }
    );


    slider.addEventListener(
        "touchmove",
        event => {

            if (
                !event.touches ||
                !event.touches.length
            ) {
                return;
            }


            touchEndX =
                event.touches[0].clientX;

        },
        {
            passive: true
        }
    );


    slider.addEventListener(
        "touchend",
        () => {

            const swipeDistance =
                touchEndX -
                touchStartX;


            const minimumSwipe =
                50;


            if (
                Math.abs(swipeDistance) >=
                minimumSwipe
            ) {

                if (swipeDistance < 0) {

                    nextSlide();

                } else {

                    previousSlide();

                }

            }


            startAutoplay();

        }
    );


    /* =====================================================
       VISIBILITY API
       Stop slider when browser tab is hidden.
       ===================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.hidden
            ) {

                stopAutoplay();

            } else {

                startAutoplay();

            }

        }
    );


    /* =====================================================
       REDUCED MOTION
       ===================================================== */

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );


    if (
        reducedMotion.matches
    ) {

        /*
         * Keep automatic changing disabled
         * for users who request reduced motion.
         */

        stopAutoplay();

    } else {

        startAutoplay();

    }


    /* =====================================================
       PUBLIC SLIDER API
       ===================================================== */

    window.SPORTING_SLIDER = {

        next: nextSlide,

        previous: previousSlide,

        goTo: index => {

            if (
                index < 0 ||
                index >= slides.length
            ) {
                return;
            }


            const direction =
                index > currentIndex
                    ? "next"
                    : "previous";


            goToSlide(
                index,
                direction
            );


            restartAutoplay();

        },

        start: startAutoplay,

        stop: stopAutoplay,

        getCurrentSlide: () =>
            currentIndex,

        getTotalSlides: () =>
            slides.length

    };

}
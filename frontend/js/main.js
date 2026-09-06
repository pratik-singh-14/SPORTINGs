/* =========================================================
   SPORTING — MAIN JAVASCRIPT
   Shared Website Functionality
   ========================================================= */

"use strict";


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeMobileMenu();
    initializeSmoothScroll();
    initializeNavbarScroll();
    initializeRevealAnimations();
    initializeCurrentPage();
    initializeBackToTop();
    initializeFormEnhancements();

});


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initializeMobileMenu() {

    const menuToggle =
        document.querySelector(".menu-toggle") ||
        document.querySelector("#menuToggle");

    const navLinks =
        document.querySelector(".nav-links") ||
        document.querySelector("#navLinks");

    if (!menuToggle || !navLinks) {
        return;
    }

    menuToggle.addEventListener("click", () => {

        navLinks.classList.toggle("active");

        menuToggle.classList.toggle("active");

        const expanded =
            navLinks.classList.contains("active");

        menuToggle.setAttribute(
            "aria-expanded",
            expanded.toString()
        );

    });


    /* Close menu after clicking a link */

    const links = navLinks.querySelectorAll("a");

    links.forEach(link => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("active");

            menuToggle.classList.remove("active");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });


    /* Close when clicking outside */

    document.addEventListener("click", event => {

        const clickedInsideMenu =
            navLinks.contains(event.target);

        const clickedToggle =
            menuToggle.contains(event.target);

        if (
            !clickedInsideMenu &&
            !clickedToggle
        ) {

            navLinks.classList.remove("active");

            menuToggle.classList.remove("active");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });

}


/* =========================================================
   SMOOTH SCROLL
   ========================================================= */

function initializeSmoothScroll() {

    const anchorLinks =
        document.querySelectorAll(
            'a[href^="#"]'
        );

    anchorLinks.forEach(link => {

        link.addEventListener("click", event => {

            const targetId =
                link.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });

}


/* =========================================================
   NAVBAR SCROLL EFFECT
   ========================================================= */

function initializeNavbarScroll() {

    const navbar =
        document.querySelector(".navbar");

    if (!navbar) {
        return;
    }

    function updateNavbar() {

        if (window.scrollY > 30) {

            navbar.classList.add("scrolled");

        } else {

            navbar.classList.remove("scrolled");

        }

    }

    updateNavbar();

    window.addEventListener(
        "scroll",
        updateNavbar,
        { passive: true }
    );

}


/* =========================================================
   REVEAL ANIMATIONS
   ========================================================= */

function initializeRevealAnimations() {

    const elements =
        document.querySelectorAll(
            ".reveal, .fade-up, .animate-on-scroll"
        );

    if (!elements.length) {
        return;
    }


    /* Respect reduced-motion settings */

    if (
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
    ) {

        elements.forEach(element => {

            element.classList.add("visible");

        });

        return;
    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -50px 0px"
            }
        );


    elements.forEach(element => {

        observer.observe(element);

    });

}


/* =========================================================
   CURRENT PAGE NAVIGATION
   ========================================================= */

function initializeCurrentPage() {

    const currentPath =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    const navLinks =
        document.querySelectorAll(
            ".nav-links a"
        );

    if (!navLinks.length) {
        return;
    }


    navLinks.forEach(link => {

        const href =
            link.getAttribute("href");

        if (!href) {
            return;
        }

        const linkPath =
            href.split("/")
                .pop()
                .split("#")[0]
                .toLowerCase();


        /* Homepage */

        if (
            (
                currentPath === "" ||
                currentPath === "index.html"
            ) &&
            (
                linkPath === "" ||
                linkPath === "index.html"
            )
        ) {

            link.classList.add("active");

            return;
        }


        /* Other pages */

        if (
            linkPath &&
            linkPath === currentPath
        ) {

            link.classList.add("active");

        }

    });

}


/* =========================================================
   BACK TO TOP
   ========================================================= */

function initializeBackToTop() {

    let button =
        document.querySelector(
            "#backToTop"
        );

    if (!button) {

        button =
            document.querySelector(
                ".back-to-top"
            );

    }

    if (!button) {
        return;
    }


    function updateButton() {

        if (window.scrollY > 500) {

            button.classList.add("show");

        } else {

            button.classList.remove("show");

        }

    }


    updateButton();

    window.addEventListener(
        "scroll",
        updateButton,
        { passive: true }
    );


    button.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


/* =========================================================
   FORM ENHANCEMENTS
   ========================================================= */

function initializeFormEnhancements() {

    const forms =
        document.querySelectorAll(
            "form"
        );

    if (!forms.length) {
        return;
    }


    forms.forEach(form => {

        form.addEventListener(
            "submit",
            () => {

                const submitButton =
                    form.querySelector(
                        'button[type="submit"], input[type="submit"]'
                    );

                if (!submitButton) {
                    return;
                }


                /* Do not permanently disable
                   the button here because backend
                   validation may reject the request. */

                submitButton.classList.add(
                    "is-submitting"
                );

            }
        );


        /* Remove submitting state
           when user changes form fields */

        form.addEventListener(
            "input",
            () => {

                const submitButton =
                    form.querySelector(
                        'button[type="submit"], input[type="submit"]'
                    );

                if (submitButton) {

                    submitButton.classList.remove(
                        "is-submitting"
                    );

                }

            }
        );

    });

}


/* =========================================================
   UTILITY — SHOW MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = "info",
    container = null
) {

    let messageBox = null;


    if (container) {

        messageBox =
            container.querySelector(
                ".message"
            );

    }


    if (!messageBox) {

        messageBox =
            document.createElement(
                "div"
            );

        messageBox.className =
            "message";

        if (container) {

            container.prepend(
                messageBox
            );

        } else {

            document.body.prepend(
                messageBox
            );

        }

    }


    messageBox.textContent =
        message;

    messageBox.className =
        `message ${type} show`;


    /* Automatically hide */

    window.setTimeout(
        () => {

            messageBox.classList.remove(
                "show"
            );

        },
        5000
    );

}


/* =========================================================
   UTILITY — FORMAT DATE
   ========================================================= */

function formatDate(
    date,
    options = {}
) {

    if (!date) {
        return "";
    }

    const dateObject =
        new Date(date);

    if (
        Number.isNaN(
            dateObject.getTime()
        )
    ) {

        return "";

    }


    const defaultOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric"
    };


    return dateObject.toLocaleDateString(
        "en-IN",
        {
            ...defaultOptions,
            ...options
        }
    );

}


/* =========================================================
   UTILITY — FORMAT DATE & TIME
   ========================================================= */

function formatDateTime(date) {

    if (!date) {
        return "";
    }

    const dateObject =
        new Date(date);

    if (
        Number.isNaN(
            dateObject.getTime()
        )
    ) {

        return "";

    }


    return dateObject.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   UTILITY — API REQUEST
   ========================================================= */

async function apiRequest(
    url,
    options = {}
) {

    const defaultOptions = {
        headers: {
            "Content-Type":
                "application/json"
        }
    };


    const requestOptions = {
        ...defaultOptions,
        ...options,

        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }

    };


    const response =
        await fetch(
            url,
            requestOptions
        );


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (!response.ok) {

        const errorMessage =
            data?.message ||
            data?.error ||
            `Request failed with status ${response.status}`;


        throw new Error(
            errorMessage
        );

    }


    return data;

}


/* =========================================================
   UTILITY — LOCAL STORAGE
   ========================================================= */

function saveToStorage(
    key,
    value
) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "Unable to save data:",
            error
        );

        return false;

    }

}


function getFromStorage(key) {

    try {

        const value =
            localStorage.getItem(key);

        if (value === null) {
            return null;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "Unable to read stored data:",
            error
        );

        return null;

    }

}


function removeFromStorage(key) {

    try {

        localStorage.removeItem(key);

        return true;

    } catch (error) {

        console.error(
            "Unable to remove stored data:",
            error
        );

        return false;

    }

}


/* =========================================================
   UTILITY — DEBOUNCE
   ========================================================= */

function debounce(
    callback,
    delay = 300
) {

    let timeoutId;


    return function (...args) {

        clearTimeout(
            timeoutId
        );


        timeoutId =
            setTimeout(
                () => {

                    callback.apply(
                        this,
                        args
                    );

                },
                delay
            );

    };

}


/* =========================================================
   UTILITY — THROTTLE
   ========================================================= */

function throttle(
    callback,
    delay = 200
) {

    let waiting = false;


    return function (...args) {

        if (waiting) {
            return;
        }


        callback.apply(
            this,
            args
        );


        waiting = true;


        setTimeout(
            () => {

                waiting = false;

            },
            delay
        );

    };

}


/* =========================================================
   UTILITY — ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        String(value);

    return div.innerHTML;

}


/* =========================================================
   UTILITY — SCROLL TO ELEMENT
   ========================================================= */

function scrollToElement(
    selector,
    offset = 80
) {

    const element =
        document.querySelector(
            selector
        );

    if (!element) {
        return;
    }


    const position =
        element.getBoundingClientRect().top +
        window.scrollY -
        offset;


    window.scrollTo({
        top: position,
        behavior: "smooth"
    });

}


/* =========================================================
   GLOBAL ERROR HANDLING
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "SPORTING error:",
            event.error || event.message
        );

    }
);


/* =========================================================
   EXPORT GLOBAL HELPERS
   ========================================================= */

window.SPORTING = {

    showMessage,

    formatDate,

    formatDateTime,

    apiRequest,

    saveToStorage,

    getFromStorage,

    removeFromStorage,

    debounce,

    throttle,

    escapeHTML,

    scrollToElement

};
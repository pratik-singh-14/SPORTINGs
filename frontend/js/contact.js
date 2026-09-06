/*
=========================================================
 SPORTING - CONTACT FORM JAVASCRIPT
 File: frontend/js/contact.js

 Features:
 - Contact form handling
 - Client-side validation
 - Email validation
 - Phone validation
 - Backend submission
 - Loading state
 - Success / error messages
 - Character counter
 - Contact information helpers
=========================================================
*/

(function () {
    "use strict";

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_BASE_URL =
        window.SPORTING_API_BASE_URL ||
        "http://localhost:5000";

    const CONTACT_ENDPOINT =
        `${API_BASE_URL}/api/contacts`;

    const COMPANY_EMAIL =
        "singhpratik0143@gmail.com";

    /* =====================================================
       INITIALIZE
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {
            initializeContactPage();
        }
    );

    function initializeContactPage() {
        const form =
            document.querySelector(
                "#contactForm"
            ) ||
            document.querySelector(
                'form[data-form="contact"]'
            );

        if (form) {
            setupContactForm(form);
        }

        setupPhoneInput();
        setupMessageCounter();
        setupContactLinks();
    }

    /* =====================================================
       CONTACT FORM
    ===================================================== */

    function setupContactForm(form) {
        form.addEventListener(
            "submit",
            handleContactSubmit
        );

        /*
         * Remove previous validation error when
         * the user starts correcting a field.
         */

        form.querySelectorAll(
            "input, textarea, select"
        ).forEach(field => {
            field.addEventListener(
                "input",
                () => {
                    clearFieldError(field);
                }
            );

            field.addEventListener(
                "change",
                () => {
                    clearFieldError(field);
                }
            );
        });
    }

    /* =====================================================
       SUBMIT CONTACT FORM
    ===================================================== */

    async function handleContactSubmit(event) {
        event.preventDefault();

        const form =
            event.currentTarget;

        clearFormMessage(form);

        const data =
            collectContactData(form);

        const validation =
            validateContactData(data);

        if (!validation.valid) {
            showFormMessage(
                form,
                validation.message,
                "error"
            );

            markFieldError(
                form,
                validation.field
            );

            focusField(
                form,
                validation.field
            );

            return;
        }

        const submitButton =
            form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

        const originalText =
            getButtonText(
                submitButton
            );

        setButtonLoading(
            submitButton,
            true,
            "Sending..."
        );

        try {
            const response =
                await fetch(
                    CONTACT_ENDPOINT,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data)
                    }
                );

            const result =
                await parseResponse(
                    response
                );

            if (
                response.status ===
                404
            ) {
                throw new Error(
                    "The contact API route is not available yet. Please make sure the SPORTING backend is running and the contact route is configured."
                );
            }

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Unable to send your message."
                );
            }

            showFormMessage(
                form,
                result.message ||
                "Thank you! Your message has been sent successfully. The SPORTING team will contact you soon.",
                "success"
            );

            showMessageId(
                form,
                result.contactId ||
                result.messageId ||
                result.id
            );

            form.reset();

            updateMessageCounter();

            /*
             * Also use the shared SPORTING message system
             * when available.
             */

            if (
                typeof window.SPORTING
                    ?.showMessage ===
                "function"
            ) {
                window.SPORTING.showMessage(
                    "Your message was sent successfully.",
                    "success"
                );
            }

        } catch (error) {
            console.error(
                "SPORTING contact form error:",
                error
            );

            showFormMessage(
                form,
                getErrorMessage(
                    error
                ),
                "error"
            );

        } finally {
            setButtonLoading(
                submitButton,
                false,
                originalText ||
                "Send Message"
            );
        }
    }

    /* =====================================================
       COLLECT DATA
    ===================================================== */

    function collectContactData(form) {
        const formData =
            new FormData(form);

        const data = {};

        formData.forEach(
            (value, key) => {
                data[key] =
                    typeof value ===
                    "string"
                        ? value.trim()
                        : value;
            }
        );

        /*
         * Support multiple possible HTML field names.
         */

        data.name =
            data.name ||
            data.fullName ||
            data.contactName ||
            "";

        data.email =
            data.email ||
            data.emailAddress ||
            "";

        data.phone =
            data.phone ||
            data.mobile ||
            data.mobileNumber ||
            "";

        data.subject =
            data.subject ||
            data.enquirySubject ||
            "";

        data.message =
            data.message ||
            data.enquiry ||
            data.details ||
            "";

        data.company =
            data.company ||
            data.organization ||
            "";

        data.phone =
            normalizePhone(
                data.phone
            );

        return data;
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    function validateContactData(data) {

        if (!data.name) {
            return {
                valid: false,
                field: "name",
                message:
                    "Please enter your name."
            };
        }

        if (
            data.name.length <
            2
        ) {
            return {
                valid: false,
                field: "name",
                message:
                    "Please enter a valid name."
            };
        }

        if (!data.email) {
            return {
                valid: false,
                field: "email",
                message:
                    "Please enter your email address."
            };
        }

        if (
            !isValidEmail(
                data.email
            )
        ) {
            return {
                valid: false,
                field: "email",
                message:
                    "Please enter a valid email address."
            };
        }

        if (
            data.phone &&
            !isValidPhone(
                data.phone
            )
        ) {
            return {
                valid: false,
                field: "phone",
                message:
                    "Please enter a valid 10-digit mobile number."
            };
        }

        if (!data.message) {
            return {
                valid: false,
                field: "message",
                message:
                    "Please enter your message."
            };
        }

        if (
            data.message.length <
            5
        ) {
            return {
                valid: false,
                field: "message",
                message:
                    "Please provide a little more information in your message."
            };
        }

        return {
            valid: true,
            field: "",
            message: ""
        };
    }

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
        );
    }

    /* =====================================================
       PHONE VALIDATION
    ===================================================== */

    function normalizePhone(phone) {
        if (!phone) {
            return "";
        }

        return String(phone)
            .replace(/\D/g, "")
            .slice(-10);
    }

    function isValidPhone(phone) {
        return /^[6-9]\d{9}$/.test(
            phone
        );
    }

    function setupPhoneInput() {
        const phoneInputs =
            document.querySelectorAll(
                '[name="phone"], ' +
                '#phone, ' +
                '#mobile, ' +
                '[name="mobile"]'
            );

        phoneInputs.forEach(
            input => {
                input.addEventListener(
                    "input",
                    () => {
                        input.value =
                            input.value
                                .replace(
                                    /\D/g,
                                    ""
                                )
                                .slice(
                                    0,
                                    10
                                );
                    }
                );
            }
        );
    }

    /* =====================================================
       MESSAGE CHARACTER COUNTER
    ===================================================== */

    function setupMessageCounter() {
        const messageFields =
            document.querySelectorAll(
                '[name="message"], ' +
                '#message'
            );

        messageFields.forEach(
            field => {

                let counter =
                    field.parentElement
                        ?.querySelector(
                            ".message-counter"
                        );

                if (!counter) {
                    counter =
                        document.createElement(
                            "small"
                        );

                    counter.className =
                        "message-counter";

                    field.parentElement
                        ?.appendChild(
                            counter
                        );
                }

                updateMessageCounterForField(
                    field,
                    counter
                );

                field.addEventListener(
                    "input",
                    () => {
                        updateMessageCounterForField(
                            field,
                            counter
                        );
                    }
                );
            }
        );
    }

    function updateMessageCounter() {
        document
            .querySelectorAll(
                '[name="message"], #message'
            )
            .forEach(
                field => {
                    const counter =
                        field.parentElement
                            ?.querySelector(
                                ".message-counter"
                            );

                    if (counter) {
                        updateMessageCounterForField(
                            field,
                            counter
                        );
                    }
                }
            );
    }

    function updateMessageCounterForField(
        field,
        counter
    ) {
        const length =
            field.value.length;

        const maxLength =
            field.maxLength >
            0
                ? field.maxLength
                : 1000;

        counter.textContent =
            `${length}/${maxLength}`;

        if (
            length >
            maxLength * 0.9
        ) {
            counter.classList.add(
                "near-limit"
            );
        } else {
            counter.classList.remove(
                "near-limit"
            );
        }
    }

    /* =====================================================
       CONTACT LINKS
    ===================================================== */

    function setupContactLinks() {

        /*
         * Automatically configure mail links that
         * use data-company-email.
         */

        document
            .querySelectorAll(
                "[data-company-email]"
            )
            .forEach(
                element => {

                    element.textContent =
                        COMPANY_EMAIL;

                    if (
                        element.tagName
                            .toLowerCase() ===
                        "a"
                    ) {
                        element.href =
                            `mailto:${COMPANY_EMAIL}`;
                    }
                }
            );

        /*
         * Configure normal email links with the
         * SPORTING company email.
         */

        document
            .querySelectorAll(
                ".company-email"
            )
            .forEach(
                element => {

                    if (
                        element.tagName
                            .toLowerCase() ===
                        "a"
                    ) {
                        element.href =
                            `mailto:${COMPANY_EMAIL}`;
                    }

                    if (
                        !element.textContent.trim()
                    ) {
                        element.textContent =
                            COMPANY_EMAIL;
                    }
                }
            );
    }

    /* =====================================================
       FORM MESSAGE
    ===================================================== */

    function showFormMessage(
        form,
        message,
        type
    ) {
        let box =
            form.querySelector(
                ".form-message"
            );

        if (!box) {
            box =
                document.createElement(
                    "div"
                );

            box.className =
                "form-message";

            form.insertBefore(
                box,
                form.firstChild
            );
        }

        box.textContent =
            message;

        box.className =
            `form-message ${type || ""}`;

        box.setAttribute(
            "role",
            "alert"
        );

        box.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    function clearFormMessage(form) {
        const box =
            form.querySelector(
                ".form-message"
            );

        if (!box) {
            return;
        }

        box.textContent =
            "";

        box.className =
            "form-message";
    }

    /* =====================================================
       MESSAGE ID
    ===================================================== */

    function showMessageId(
        form,
        messageId
    ) {
        if (!messageId) {
            return;
        }

        let box =
            form.querySelector(
                ".contact-message-id"
            );

        if (box) {
            box.remove();
        }

        box =
            document.createElement(
                "div"
            );

        box.className =
            "contact-message-id";

        box.innerHTML = `
            <strong>
                Reference ID
            </strong>

            <span>
                ${escapeHTML(
                    String(messageId)
                )}
            </span>
        `;

        form.appendChild(
            box
        );
    }

    /* =====================================================
       FIELD ERROR
    ===================================================== */

    function markFieldError(
        form,
        fieldName
    ) {
        if (!fieldName) {
            return;
        }

        const field =
            findField(
                form,
                fieldName
            );

        if (!field) {
            return;
        }

        field.classList.add(
            "input-error"
        );

        field.setAttribute(
            "aria-invalid",
            "true"
        );
    }

    function clearFieldError(
        field
    ) {
        field.classList.remove(
            "input-error"
        );

        field.removeAttribute(
            "aria-invalid"
        );
    }

    function focusField(
        form,
        fieldName
    ) {
        const field =
            findField(
                form,
                fieldName
            );

        if (!field) {
            return;
        }

        field.focus();

        field.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    function findField(
        form,
        fieldName
    ) {
        return (
            form.querySelector(
                `[name="${fieldName}"]`
            ) ||
            form.querySelector(
                `#${fieldName}`
            )
        );
    }

    /* =====================================================
       BUTTON LOADING
    ===================================================== */

    function getButtonText(button) {
        if (!button) {
            return "";
        }

        return (
            button.dataset
                .originalText ||
            button.textContent ||
            button.value ||
            ""
        );
    }

    function setButtonLoading(
        button,
        loading,
        text
    ) {
        if (!button) {
            return;
        }

        if (loading) {

            button.dataset
                .originalText =
                getButtonText(button);

            button.disabled =
                true;

            if (
                button.tagName
                    .toLowerCase() ===
                "input"
            ) {
                button.value =
                    text;
            } else {
                button.textContent =
                    text;
            }

            button.classList.add(
                "is-loading"
            );

        } else {

            button.disabled =
                false;

            const original =
                button.dataset
                    .originalText ||
                text;

            if (
                button.tagName
                    .toLowerCase() ===
                "input"
            ) {
                button.value =
                    original;
            } else {
                button.textContent =
                    original;
            }

            button.classList.remove(
                "is-loading"
            );
        }
    }

    /* =====================================================
       API TEST
    ===================================================== */

    async function testContactAPI() {
        try {
            const response =
                await fetch(
                    CONTACT_ENDPOINT,
                    {
                        method:
                            "OPTIONS"
                    }
                );

            return {
                success:
                    response.ok,
                status:
                    response.status
            };

        } catch (error) {
            return {
                success: false,
                error:
                    error.message
            };
        }
    }

    /* =====================================================
       RESPONSE PARSER
    ===================================================== */

    async function parseResponse(
        response
    ) {
        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            return await response.json();
        }

        const text =
            await response.text();

        return {
            message: text
        };
    }

    /* =====================================================
       ERROR MESSAGE
    ===================================================== */

    function getErrorMessage(
        error
    ) {
        if (
            error?.message &&
            error.message.includes(
                "Failed to fetch"
            )
        ) {
            return (
                "Unable to connect to the SPORTING server. Please make sure the backend is running."
            );
        }

        return (
            error?.message ||
            "Something went wrong while sending your message. Please try again."
        );
    }

    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(
        value
    ) {
        return String(
            value
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.SPORTING_CONTACT = {

        submit:
            handleContactSubmit,

        validate:
            validateContactData,

        testAPI:
            testContactAPI,

        endpoint:
            CONTACT_ENDPOINT,

        companyEmail:
            COMPANY_EMAIL,

        normalizePhone:
            normalizePhone

    };

})();
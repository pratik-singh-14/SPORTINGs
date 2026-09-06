/*
=========================================================
 SPORTING - PARTICIPANT REGISTRATION
 File: frontend/js/register.js
 Purpose:
 - Handle participant registration form
 - Validate participant details
 - Submit registration to Node.js backend
 - Show success/error messages
=========================================================
*/

(function () {
    "use strict";

    const API_BASE_URL =
        window.SPORTING_API_BASE_URL ||
        "http://localhost:5000";

    const REGISTER_ENDPOINT =
        `${API_BASE_URL}/api/participants`;

    document.addEventListener("DOMContentLoaded", () => {
        initializeRegistrationForm();
        setMinimumEventDate();
    });

    /* =====================================================
       FIND REGISTRATION FORM
    ===================================================== */

    function initializeRegistrationForm() {
        const form =
            document.querySelector("#registrationForm") ||
            document.querySelector("#registerForm") ||
            document.querySelector('form[data-form="registration"]');

        if (!form) {
            return;
        }

        form.addEventListener("submit", handleRegistrationSubmit);

        setupPhoneField(form);
        setupAgeField(form);
        setupEmergencyPhoneField(form);
    }

    /* =====================================================
       FORM SUBMISSION
    ===================================================== */

    async function handleRegistrationSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;

        clearFormMessage(form);

        const participantData = collectFormData(form);

        const validation = validateParticipant(participantData);

        if (!validation.valid) {
            showFormMessage(
                form,
                validation.message,
                "error"
            );

            focusField(form, validation.field);

            return;
        }

        const submitButton =
            form.querySelector(
                'button[type="submit"], input[type="submit"]'
            );

        const originalButtonText =
            submitButton
                ? submitButton.textContent || submitButton.value
                : "";

        setLoadingState(
            submitButton,
            true,
            "Submitting..."
        );

        try {
            const response = await fetch(
                REGISTER_ENDPOINT,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(participantData)
                }
            );

            const result = await parseResponse(response);

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    result.error ||
                    "Registration failed. Please try again."
                );
            }

            showFormMessage(
                form,
                result.message ||
                "Registration successful! Your participant registration has been submitted.",
                "success"
            );

            showRegistrationId(
                form,
                result.participantId ||
                result.registrationId ||
                result.id
            );

            resetFormAfterSuccess(form);

            if (typeof window.SPORTING?.showMessage === "function") {
                window.SPORTING.showMessage(
                    "Registration submitted successfully.",
                    "success"
                );
            }

        } catch (error) {
            console.error(
                "SPORTING registration error:",
                error
            );

            showFormMessage(
                form,
                getErrorMessage(error),
                "error"
            );

        } finally {
            setLoadingState(
                submitButton,
                false,
                originalButtonText || "Register"
            );
        }
    }

    /* =====================================================
       COLLECT FORM DATA
    ===================================================== */

    function collectFormData(form) {
        const formData = new FormData(form);

        const data = {};

        formData.forEach((value, key) => {
            data[key] =
                typeof value === "string"
                    ? value.trim()
                    : value;
        });

        /*
         * Support common alternate field names.
         */

        data.name =
            data.name ||
            data.fullName ||
            data.participantName ||
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

        data.event =
            data.event ||
            data.eventName ||
            data.competitionName ||
            "";

        data.eventId =
            data.eventId ||
            data.eventID ||
            "";

        data.sport =
            data.sport ||
            data.sports ||
            "";

        data.gender =
            data.gender ||
            "";

        data.age =
            data.age ||
            "";

        data.dateOfBirth =
            data.dateOfBirth ||
            data.dob ||
            "";

        data.address =
            data.address ||
            "";

        data.city =
            data.city ||
            "";

        data.state =
            data.state ||
            "";

        data.pincode =
            data.pincode ||
            data.zipCode ||
            "";

        data.emergencyContactName =
            data.emergencyContactName ||
            data.emergencyName ||
            "";

        data.emergencyContactPhone =
            data.emergencyContactPhone ||
            data.emergencyPhone ||
            "";

        data.category =
            data.category ||
            "";

        data.tshirtSize =
            data.tshirtSize ||
            data.shirtSize ||
            "";

        data.message =
            data.message ||
            data.notes ||
            "";

        /*
         * Normalize phone numbers.
         */

        data.phone = normalizePhone(data.phone);

        data.emergencyContactPhone =
            normalizePhone(
                data.emergencyContactPhone
            );

        /*
         * Convert age to number when supplied.
         */

        if (data.age !== "") {
            const ageNumber = Number(data.age);

            if (!Number.isNaN(ageNumber)) {
                data.age = ageNumber;
            }
        }

        return data;
    }

    /* =====================================================
       VALIDATION
    ===================================================== */

    function validateParticipant(data) {

        if (!data.name) {
            return {
                valid: false,
                field: "name",
                message: "Please enter the participant's full name."
            };
        }

        if (data.name.length < 2) {
            return {
                valid: false,
                field: "name",
                message: "Please enter a valid participant name."
            };
        }

        if (!data.phone) {
            return {
                valid: false,
                field: "phone",
                message: "Please enter a mobile number."
            };
        }

        if (!isValidPhone(data.phone)) {
            return {
                valid: false,
                field: "phone",
                message: "Please enter a valid 10-digit mobile number."
            };
        }

        if (!data.email) {
            return {
                valid: false,
                field: "email",
                message: "Please enter an email address."
            };
        }

        if (!isValidEmail(data.email)) {
            return {
                valid: false,
                field: "email",
                message: "Please enter a valid email address."
            };
        }

        if (!data.event && !data.eventId) {
            return {
                valid: false,
                field: "event",
                message: "Please select an event."
            };
        }

        if (!data.sport) {
            return {
                valid: false,
                field: "sport",
                message: "Please select a sport."
            };
        }

        if (
            data.age !== "" &&
            (
                Number(data.age) < 5 ||
                Number(data.age) > 100
            )
        ) {
            return {
                valid: false,
                field: "age",
                message: "Please enter a valid age."
            };
        }

        if (
            data.emergencyContactPhone &&
            !isValidPhone(data.emergencyContactPhone)
        ) {
            return {
                valid: false,
                field: "emergencyContactPhone",
                message: "Please enter a valid emergency contact number."
            };
        }

        return {
            valid: true,
            message: ""
        };
    }

    /* =====================================================
       PHONE HELPERS
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
        return /^[6-9]\d{9}$/.test(phone);
    }

    function setupPhoneField(form) {
        const phone =
            form.querySelector(
                '[name="phone"], #phone, #mobile'
            );

        if (!phone) {
            return;
        }

        phone.addEventListener("input", () => {
            phone.value =
                phone.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
        });
    }

    function setupEmergencyPhoneField(form) {
        const phone =
            form.querySelector(
                '[name="emergencyContactPhone"], [name="emergencyPhone"], #emergencyContactPhone'
            );

        if (!phone) {
            return;
        }

        phone.addEventListener("input", () => {
            phone.value =
                phone.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
        });
    }

    /* =====================================================
       AGE FIELD
    ===================================================== */

    function setupAgeField(form) {
        const age =
            form.querySelector(
                '[name="age"], #age'
            );

        if (!age) {
            return;
        }

        age.addEventListener("input", () => {
            age.value =
                age.value
                    .replace(/\D/g, "")
                    .slice(0, 3);
        });
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
       MINIMUM EVENT DATE
    ===================================================== */

    function setMinimumEventDate() {
        const dateInputs =
            document.querySelectorAll(
                'input[type="date"][name="eventDate"], ' +
                'input[type="date"][name="date"], ' +
                'input[type="date"]#eventDate'
            );

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        dateInputs.forEach(input => {
            input.min = today;
        });
    }

    /* =====================================================
       RESPONSE PARSER
    ===================================================== */

    async function parseResponse(response) {
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

    function getErrorMessage(error) {
        if (
            error &&
            error.message &&
            error.message.includes(
                "Failed to fetch"
            )
        ) {
            return (
                "Unable to connect to the SPORTING server. " +
                "Please make sure the backend is running."
            );
        }

        return (
            error?.message ||
            "Something went wrong while submitting your registration."
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
        let messageBox =
            form.querySelector(
                ".form-message"
            );

        if (!messageBox) {
            messageBox =
                document.createElement("div");

            messageBox.className =
                "form-message";

            form.insertBefore(
                messageBox,
                form.firstChild
            );
        }

        messageBox.className =
            `form-message ${type}`;

        messageBox.textContent =
            message;

        messageBox.setAttribute(
            "role",
            "alert"
        );

        messageBox.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    function clearFormMessage(form) {
        const messageBox =
            form.querySelector(
                ".form-message"
            );

        if (messageBox) {
            messageBox.textContent = "";
            messageBox.className =
                "form-message";
        }

        const registrationBox =
            form.querySelector(
                ".registration-id"
            );

        if (registrationBox) {
            registrationBox.remove();
        }
    }

    /* =====================================================
       REGISTRATION ID
    ===================================================== */

    function showRegistrationId(
        form,
        registrationId
    ) {
        if (!registrationId) {
            return;
        }

        const box =
            document.createElement("div");

        box.className =
            "registration-id";

        box.innerHTML = `
            <strong>Registration ID</strong>
            <span>${escapeHTML(
                String(registrationId)
            )}</span>
            <small>
                Please save this ID for your records.
            </small>
        `;

        form.appendChild(box);
    }

    /* =====================================================
       RESET FORM AFTER SUCCESS
    ===================================================== */

    function resetFormAfterSuccess(form) {
        setTimeout(() => {
            form.reset();
            setMinimumEventDate();
        }, 500);
    }

    /* =====================================================
       BUTTON LOADING STATE
    ===================================================== */

    function setLoadingState(
        button,
        loading,
        text
    ) {
        if (!button) {
            return;
        }

        if (loading) {
            button.dataset.originalText =
                button.textContent ||
                button.value ||
                "";

            button.disabled = true;

            if (
                button.tagName.toLowerCase() ===
                "input"
            ) {
                button.value = text;
            } else {
                button.textContent = text;
            }

            button.classList.add(
                "is-loading"
            );

        } else {
            button.disabled = false;

            const original =
                button.dataset.originalText ||
                text;

            if (
                button.tagName.toLowerCase() ===
                "input"
            ) {
                button.value = original;
            } else {
                button.textContent = original;
            }

            button.classList.remove(
                "is-loading"
            );
        }
    }

    /* =====================================================
       FOCUS INVALID FIELD
    ===================================================== */

    function focusField(
        form,
        fieldName
    ) {
        if (!fieldName) {
            return;
        }

        const field =
            form.querySelector(
                `[name="${fieldName}"], #${fieldName}`
            );

        if (!field) {
            return;
        }

        field.focus();

        field.classList.add(
            "input-error"
        );

        setTimeout(() => {
            field.classList.remove(
                "input-error"
            );
        }, 2500);
    }

    /* =====================================================
       HTML ESCAPE
    ===================================================== */

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =====================================================
       API TEST
    ===================================================== */

    async function testRegistrationAPI() {
        try {
            const response =
                await fetch(
                    `${API_BASE_URL}/api/participants`
                );

            return {
                success: response.ok,
                status: response.status
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.SPORTING_REGISTRATION = {
        submit: handleRegistrationSubmit,
        validate: validateParticipant,
        testAPI: testRegistrationAPI,
        endpoint: REGISTER_ENDPOINT,
        normalizePhone: normalizePhone
    };

})();
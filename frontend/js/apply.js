/* =========================================================
   SPORTING — APPLY / ORGANIZE EVENT
   Application Form + Backend API Submission
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    initializeApplicationForm();
});


/* =========================================================
   CONFIGURATION
   ========================================================= */

const SPORTING_API_BASE_URL =
    window.SPORTING_API_BASE_URL ||
    "http://localhost:5000";


const APPLICATION_ENDPOINT =
    `${SPORTING_API_BASE_URL}/api/applications`;


/* =========================================================
   INITIALIZE APPLICATION FORM
   ========================================================= */

function initializeApplicationForm() {

    const form =
        document.querySelector("#applicationForm") ||
        document.querySelector("#applyForm") ||
        document.querySelector('form[data-form="application"]');

    if (!form) {
        return;
    }


    setupApplicationForm(form);
}


/* =========================================================
   FORM SETUP
   ========================================================= */

function setupApplicationForm(form) {

    const submitButton =
        form.querySelector(
            'button[type="submit"], input[type="submit"]'
        );


    const messageBox =
        findOrCreateMessageBox(form);


    /* -----------------------------------------------------
       Event Type Selection
       ----------------------------------------------------- */

    const eventType =
        findField(
            form,
            [
                "eventType",
                "event-type",
                "applicationType",
                "serviceType"
            ]
        );


    if (eventType) {

        eventType.addEventListener(
            "change",
            () => {

                updateApplicationFormFields(
                    form,
                    eventType.value
                );

            }
        );


        updateApplicationFormFields(
            form,
            eventType.value
        );

    }


    /* -----------------------------------------------------
       Phone Formatting
       ----------------------------------------------------- */

    const phone =
        findField(
            form,
            [
                "phone",
                "mobile",
                "phoneNumber"
            ]
        );


    if (phone) {

        phone.addEventListener(
            "input",
            () => {

                phone.value =
                    phone.value
                        .replace(/[^\d+\-\s()]/g, "")
                        .slice(0, 20);

            }
        );

    }


    /* -----------------------------------------------------
       Budget Formatting
       ----------------------------------------------------- */

    const budget =
        findField(
            form,
            [
                "budget",
                "estimatedBudget"
            ]
        );


    if (budget) {

        budget.addEventListener(
            "input",
            () => {

                budget.value =
                    budget.value
                        .replace(/[^\d]/g, "");

            }
        );

    }


    /* -----------------------------------------------------
       Expected Participants
       ----------------------------------------------------- */

    const participants =
        findField(
            form,
            [
                "expectedParticipants",
                "participants",
                "participantCount"
            ]
        );


    if (participants) {

        participants.addEventListener(
            "input",
            () => {

                participants.value =
                    participants.value
                        .replace(/[^\d]/g, "");

            }
        );

    }


    /* -----------------------------------------------------
       Event Date
       ----------------------------------------------------- */

    const eventDate =
        findField(
            form,
            [
                "eventDate",
                "date"
            ]
        );


    if (eventDate) {

        setMinimumEventDate(
            eventDate
        );

    }


    /* -----------------------------------------------------
       Submit
       ----------------------------------------------------- */

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            clearApplicationMessage(
                messageBox
            );


            const validation =
                validateApplicationForm(
                    form
                );


            if (!validation.valid) {

                showApplicationMessage(
                    messageBox,
                    validation.message,
                    "error"
                );

                focusInvalidField(
                    form,
                    validation.field
                );

                return;
            }


            const applicationData =
                collectApplicationData(
                    form
                );


            setSubmitState(
                submitButton,
                true
            );


            showApplicationMessage(
                messageBox,
                "Submitting your event application...",
                "info"
            );


            try {

                const result =
                    await submitApplication(
                        applicationData
                    );


                handleSuccessfulSubmission(
                    form,
                    messageBox,
                    submitButton,
                    result
                );

            } catch (error) {

                console.error(
                    "SPORTING application error:",
                    error
                );


                handleSubmissionError(
                    messageBox,
                    submitButton,
                    error
                );

            }

        }
    );

}


/* =========================================================
   FIND FORM FIELD
   ========================================================= */

function findField(
    form,
    names
) {

    for (const name of names) {

        const field =
            form.querySelector(
                `[name="${name}"]`
            );


        if (field) {
            return field;
        }


        const byId =
            form.querySelector(
                `#${name}`
            );


        if (byId) {
            return byId;
        }

    }


    return null;
}


/* =========================================================
   FIND OR CREATE MESSAGE BOX
   ========================================================= */

function findOrCreateMessageBox(form) {

    let messageBox =
        form.querySelector(
            ".application-message"
        );


    if (!messageBox) {

        messageBox =
            document.createElement(
                "div"
            );


        messageBox.className =
            "application-message";


        messageBox.setAttribute(
            "role",
            "alert"
        );


        form.prepend(
            messageBox
        );

    }


    return messageBox;
}


/* =========================================================
   UPDATE FORM FIELDS
   ========================================================= */

function updateApplicationFormFields(
    form,
    eventType
) {

    /*
     * The application form supports:
     *
     * 1. Organizing a Marathon
     * 2. Organizing any Sports Competition
     * 3. Hiring SPORTING for Complete Event Management
     *
     * This function keeps the form flexible.
     */


    const sportField =
        findField(
            form,
            [
                "sport",
                "sports"
            ]
        );


    if (!sportField) {
        return;
    }


    const normalizedType =
        String(eventType || "")
            .toLowerCase()
            .trim();


    const marathonSelected =
        normalizedType.includes(
            "marathon"
        );


    if (
        marathonSelected &&
        sportField.tagName === "SELECT"
    ) {

        const runningOption =
            Array.from(
                sportField.options
            ).find(
                option =>
                    option.value
                        .toLowerCase()
                        .includes("running") ||
                    option.textContent
                        .toLowerCase()
                        .includes("running") ||
                    option.value
                        .toLowerCase()
                        .includes("marathon") ||
                    option.textContent
                        .toLowerCase()
                        .includes("marathon")
            );


        if (runningOption) {

            sportField.value =
                runningOption.value;

        }

    }

}


/* =========================================================
   SET MINIMUM EVENT DATE
   ========================================================= */

function setMinimumEventDate(
    dateField
) {

    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    dateField.min =
        `${year}-${month}-${day}`;

}


/* =========================================================
   VALIDATE FORM
   ========================================================= */

function validateApplicationForm(
    form
) {

    const eventType =
        findField(
            form,
            [
                "eventType",
                "event-type",
                "applicationType",
                "serviceType"
            ]
        );


    const name =
        findField(
            form,
            [
                "name",
                "fullName",
                "applicantName"
            ]
        );


    const phone =
        findField(
            form,
            [
                "phone",
                "mobile",
                "phoneNumber"
            ]
        );


    const email =
        findField(
            form,
            [
                "email",
                "emailAddress"
            ]
        );


    const competitionName =
        findField(
            form,
            [
                "competitionName",
                "competition",
                "eventName"
            ]
        );


    const sport =
        findField(
            form,
            [
                "sport",
                "sports"
            ]
        );


    const eventDate =
        findField(
            form,
            [
                "eventDate",
                "date"
            ]
        );


    const location =
        findField(
            form,
            [
                "location",
                "eventLocation"
            ]
        );


    const expectedParticipants =
        findField(
            form,
            [
                "expectedParticipants",
                "participants",
                "participantCount"
            ]
        );


    /* -----------------------------------------------------
       Required: Event Type
       ----------------------------------------------------- */

    if (
        eventType &&
        !eventType.value.trim()
    ) {

        return {
            valid: false,
            message:
                "Please select the type of event you want SPORTING to organize.",
            field: eventType
        };

    }


    /* -----------------------------------------------------
       Required: Name
       ----------------------------------------------------- */

    if (
        name &&
        name.value.trim().length < 2
    ) {

        return {
            valid: false,
            message:
                "Please enter your full name.",
            field: name
        };

    }


    /* -----------------------------------------------------
       Required: Phone
       ----------------------------------------------------- */

    if (
        phone &&
        !isValidPhone(
            phone.value
        )
    ) {

        return {
            valid: false,
            message:
                "Please enter a valid phone number.",
            field: phone
        };

    }


    /* -----------------------------------------------------
       Required: Email
       ----------------------------------------------------- */

    if (
        email &&
        !isValidEmail(
            email.value
        )
    ) {

        return {
            valid: false,
            message:
                "Please enter a valid email address.",
            field: email
        };

    }


    /* -----------------------------------------------------
       Required: Competition Name
       ----------------------------------------------------- */

    if (
        competitionName &&
        competitionName.value.trim().length < 2
    ) {

        return {
            valid: false,
            message:
                "Please enter the competition or event name.",
            field: competitionName
        };

    }


    /* -----------------------------------------------------
       Required: Sport
       ----------------------------------------------------- */

    if (
        sport &&
        !sport.value.trim()
    ) {

        return {
            valid: false,
            message:
                "Please select the sport.",
            field: sport
        };

    }


    /* -----------------------------------------------------
       Required: Event Date
       ----------------------------------------------------- */

    if (
        eventDate &&
        !eventDate.value
    ) {

        return {
            valid: false,
            message:
                "Please select the event date.",
            field: eventDate
        };

    }


    if (
        eventDate &&
        eventDate.value
    ) {

        const selectedDate =
            new Date(
                `${eventDate.value}T00:00:00`
            );


        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        if (
            selectedDate <
            today
        ) {

            return {
                valid: false,
                message:
                    "The event date cannot be in the past.",
                field: eventDate
            };

        }

    }


    /* -----------------------------------------------------
       Required: Location
       ----------------------------------------------------- */

    if (
        location &&
        location.value.trim().length < 2
    ) {

        return {
            valid: false,
            message:
                "Please enter the event location.",
            field: location
        };

    }


    /* -----------------------------------------------------
       Expected Participants
       ----------------------------------------------------- */

    if (
        expectedParticipants &&
        expectedParticipants.value
    ) {

        const count =
            Number(
                expectedParticipants.value
            );


        if (
            !Number.isInteger(count) ||
            count < 1
        ) {

            return {
                valid: false,
                message:
                    "Please enter a valid number of expected participants.",
                field: expectedParticipants
            };

        }

    }


    return {
        valid: true,
        message: ""
    };

}


/* =========================================================
   COLLECT FORM DATA
   ========================================================= */

function collectApplicationData(
    form
) {

    const formData =
        new FormData(
            form
        );


    const data = {};


    formData.forEach(
        (value, key) => {

            if (
                typeof value ===
                "string"
            ) {

                data[key] =
                    value.trim();

            } else {

                data[key] =
                    value;

            }

        }
    );


    /*
     * Normalize common field names
     * so the backend receives predictable
     * property names.
     */

    const normalizedData = {

        name:
            data.name ||
            data.fullName ||
            data.applicantName ||
            "",


        phone:
            data.phone ||
            data.mobile ||
            data.phoneNumber ||
            "",


        email:
            data.email ||
            data.emailAddress ||
            "",


        competitionName:
            data.competitionName ||
            data.competition ||
            data.eventName ||
            "",


        sport:
            data.sport ||
            data.sports ||
            "",


        eventDate:
            data.eventDate ||
            data.date ||
            "",


        location:
            data.location ||
            data.eventLocation ||
            "",


        expectedParticipants:
            data.expectedParticipants ||
            data.participants ||
            data.participantCount ||
            "",


        eventType:
            data.eventType ||
            data["event-type"] ||
            data.applicationType ||
            data.serviceType ||
            "",


        requiredFacilities:
            data.requiredFacilities ||
            data.facilities ||
            "",


        budget:
            data.budget ||
            data.estimatedBudget ||
            "",


        message:
            data.message ||
            data.description ||
            data.requirements ||
            ""

    };


    /*
     * Preserve any additional fields
     * that may have been added later.
     */

    Object.keys(data).forEach(
        key => {

            if (
                !(key in normalizedData)
            ) {

                normalizedData[key] =
                    data[key];

            }

        }
    );


    return normalizedData;

}


/* =========================================================
   SUBMIT APPLICATION TO BACKEND
   ========================================================= */

async function submitApplication(
    applicationData
) {

    const response =
        await fetch(
            APPLICATION_ENDPOINT,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        applicationData
                    )
            }
        );


    let result = null;


    try {

        result =
            await response.json();

    } catch (error) {

        result = null;

    }


    if (!response.ok) {

        const backendMessage =
            result?.message ||
            result?.error ||
            `Unable to submit application. Server returned ${response.status}.`;


        throw new Error(
            backendMessage
        );

    }


    return (
        result || {
            success: true
        }
    );

}


/* =========================================================
   SUCCESS HANDLER
   ========================================================= */

function handleSuccessfulSubmission(
    form,
    messageBox,
    submitButton,
    result
) {

    const successMessage =
        result?.message ||
        "Your event application has been submitted successfully. The SPORTING team will contact you soon.";


    showApplicationMessage(
        messageBox,
        successMessage,
        "success"
    );


    setSubmitState(
        submitButton,
        false
    );


    /*
     * Reset the form after successful submission.
     */

    form.reset();


    /*
     * Restore minimum date for the
     * event-date field after reset.
     */

    const eventDate =
        findField(
            form,
            [
                "eventDate",
                "date"
            ]
        );


    if (eventDate) {

        setMinimumEventDate(
            eventDate
        );

    }


    /*
     * If the backend returns an application ID,
     * show it to the user.
     */

    if (
        result?.applicationId
    ) {

        showApplicationMessage(
            messageBox,
            `${successMessage} Application ID: ${result.applicationId}`,
            "success"
        );

    }

}


/* =========================================================
   ERROR HANDLER
   ========================================================= */

function handleSubmissionError(
    messageBox,
    submitButton,
    error
) {

    setSubmitState(
        submitButton,
        false
    );


    let message =
        error?.message ||
        "Something went wrong while submitting your application.";


    /*
     * Helpful message when frontend is running
     * but backend server is unavailable.
     */

    if (
        error?.message ===
        "Failed to fetch"
    ) {

        message =
            "Unable to connect to the SPORTING server. Please make sure the backend is running and try again.";

    }


    showApplicationMessage(
        messageBox,
        message,
        "error"
    );

}


/* =========================================================
   SUBMIT BUTTON STATE
   ========================================================= */

function setSubmitState(
    button,
    loading
) {

    if (!button) {
        return;
    }


    if (loading) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.disabled =
            true;


        button.classList.add(
            "loading"
        );


        button.textContent =
            "Submitting...";


    } else {

        button.disabled =
            false;


        button.classList.remove(
            "loading"
        );


        button.textContent =
            button.dataset.originalText ||
            "Submit Application";

    }

}


/* =========================================================
   SHOW APPLICATION MESSAGE
   ========================================================= */

function showApplicationMessage(
    messageBox,
    message,
    type
) {

    if (!messageBox) {
        return;
    }


    messageBox.textContent =
        message;


    messageBox.className =
        `application-message ${type} show`;


    messageBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


/* =========================================================
   CLEAR APPLICATION MESSAGE
   ========================================================= */

function clearApplicationMessage(
    messageBox
) {

    if (!messageBox) {
        return;
    }


    messageBox.textContent =
        "";


    messageBox.className =
        "application-message";

}


/* =========================================================
   FOCUS INVALID FIELD
   ========================================================= */

function focusInvalidField(
    form,
    field
) {

    if (!field) {
        return;
    }


    field.classList.add(
        "input-error"
    );


    field.focus();


    setTimeout(
        () => {

            field.classList.remove(
                "input-error"
            );

        },
        3000
    );

}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(
    email
) {

    const value =
        String(email || "")
            .trim();


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return emailPattern.test(
        value
    );

}


/* =========================================================
   PHONE VALIDATION
   ========================================================= */

function isValidPhone(
    phone
) {

    const value =
        String(phone || "")
            .trim();


    /*
     * Supports Indian and international
     * phone number formats.
     */

    const digits =
        value.replace(
            /\D/g,
            ""
        );


    return (
        digits.length >= 10 &&
        digits.length <= 15
    );

}


/* =========================================================
   RETRY CONNECTION
   ========================================================= */

async function testApplicationAPI() {

    try {

        const response =
            await fetch(
                `${SPORTING_API_BASE_URL}/api/test`,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            return {
                success: false,
                status:
                    response.status
            };

        }


        const data =
            await response.json();


        return {
            success: true,
            data
        };


    } catch (error) {

        return {
            success: false,
            error:
                error.message
        };

    }

}


/* =========================================================
   PUBLIC API
   ========================================================= */

window.SPORTING_APPLICATION = {

    submit:
        submitApplication,

    collect:
        collectApplicationData,

    validate:
        validateApplicationForm,

    testAPI:
        testApplicationAPI,

    endpoint:
        APPLICATION_ENDPOINT

};
/*
=========================================================
 SPORTING - EMAIL UTILITY
 File: backend/utils/email.js
=========================================================
*/

const nodemailer = require("nodemailer");

/*
=========================================================
 ENVIRONMENT SETTINGS
=========================================================
*/

const EMAIL_USER =
    process.env.EMAIL_USER;

const EMAIL_PASS =
    process.env.EMAIL_PASS;

const COMPANY_EMAIL =
    process.env.COMPANY_EMAIL ||
    "singhpratik0143@gmail.com";

/*
=========================================================
 CREATE EMAIL TRANSPORTER
=========================================================
*/

let transporter = null;

const createTransporter = () => {
    if (
        transporter
    ) {
        return transporter;
    }

    if (
        !EMAIL_USER ||
        !EMAIL_PASS
    ) {
        console.warn(
            "Email service is not configured. Add EMAIL_USER and EMAIL_PASS to .env."
        );

        return null;
    }

    transporter =
        nodemailer.createTransport({
            service: "gmail",

            auth: {
                user:
                    EMAIL_USER,

                pass:
                    EMAIL_PASS
            }
        });

    return transporter;
};

/*
=========================================================
 VERIFY EMAIL CONFIGURATION
=========================================================
*/

const verifyEmailConnection =
    async () => {

        try {
            const mailer =
                createTransporter();

            if (!mailer) {
                return {
                    success: false,
                    message:
                        "Email service is not configured."
                };
            }

            await mailer.verify();

            console.log(
                "Email service connected successfully."
            );

            return {
                success: true,
                message:
                    "Email service is ready."
            };

        } catch (error) {

            console.error(
                "Email service verification failed:",
                error.message
            );

            return {
                success: false,
                message:
                    error.message
            };
        }
    };

/*
=========================================================
 SEND EMAIL
=========================================================
*/

const sendEmail =
    async ({
        to,
        subject,
        html,
        text,
        replyTo,
        cc,
        bcc
    }) => {

        try {

            /*
            -------------------------------------------------
            Validate recipient
            -------------------------------------------------
            */

            if (!to) {
                throw new Error(
                    "Email recipient is required."
                );
            }

            /*
            -------------------------------------------------
            Validate subject
            -------------------------------------------------
            */

            if (!subject) {
                throw new Error(
                    "Email subject is required."
                );
            }

            /*
            -------------------------------------------------
            Get transporter
            -------------------------------------------------
            */

            const mailer =
                createTransporter();

            if (!mailer) {

                console.warn(
                    `Email skipped because SMTP is not configured. Intended recipient: ${to}`
                );

                return {
                    success: false,
                    skipped: true,
                    message:
                        "Email service is not configured."
                };
            }

            /*
            -------------------------------------------------
            Prepare mail
            -------------------------------------------------
            */

            const mailOptions = {

                from: {
                    name:
                        "SPORTING",
                    address:
                        EMAIL_USER
                },

                to,

                subject,

                html:
                    html ||
                    createDefaultHTML(
                        text ||
                        ""
                    ),

                text:
                    text ||
                    stripHTML(
                        html ||
                        ""
                    )
            };

            /*
            -------------------------------------------------
            Optional reply-to
            -------------------------------------------------
            */

            if (
                replyTo
            ) {
                mailOptions.replyTo =
                    replyTo;
            }

            /*
            -------------------------------------------------
            Optional CC
            -------------------------------------------------
            */

            if (
                cc
            ) {
                mailOptions.cc =
                    cc;
            }

            /*
            -------------------------------------------------
            Optional BCC
            -------------------------------------------------
            */

            if (
                bcc
            ) {
                mailOptions.bcc =
                    bcc;
            }

            /*
            -------------------------------------------------
            Send email
            -------------------------------------------------
            */

            const info =
                await mailer.sendMail(
                    mailOptions
                );

            console.log(
                `Email sent successfully to ${to}`
            );

            console.log(
                `Message ID: ${info.messageId}`
            );

            return {
                success: true,

                message:
                    "Email sent successfully.",

                messageId:
                    info.messageId,

                response:
                    info.response
            };

        } catch (error) {

            console.error(
                "Send email error:",
                error.message
            );

            throw error;
        }
    };

/*
=========================================================
 SEND CONTACT EMAIL
=========================================================
*/

const sendContactEmail =
    async ({
        name,
        email,
        phone,
        company,
        subject,
        message
    }) => {

        const emailSubject =
            subject
                ? `SPORTING Contact: ${subject}`
                : "New SPORTING Website Contact";

        const html = `
<!DOCTYPE html>

<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>SPORTING Contact</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,Helvetica,sans-serif;
">

    <div style="
        max-width:700px;
        margin:30px auto;
        background:#ffffff;
        border-radius:12px;
        overflow:hidden;
        border:1px solid #e5e7eb;
    ">

        <div style="
            padding:28px;
            background:#111827;
            color:#ffffff;
        ">

            <h1 style="
                margin:0;
                font-size:30px;
            ">
                SPORTING
            </h1>

            <p style="
                margin:8px 0 0;
                color:#d1d5db;
            ">
                Run. Play. Achieve.
            </p>

        </div>

        <div style="
            padding:28px;
        ">

            <h2>
                New Contact Message
            </h2>

            <p>
                A visitor has submitted a message through the SPORTING website.
            </p>

            <table style="
                width:100%;
                border-collapse:collapse;
                margin-top:20px;
            ">

                <tr>
                    <td style="
                        padding:10px;
                        font-weight:bold;
                    ">
                        Name
                    </td>

                    <td style="
                        padding:10px;
                    ">
                        ${escapeHTML(name)}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:10px;
                        font-weight:bold;
                    ">
                        Email
                    </td>

                    <td style="
                        padding:10px;
                    ">
                        ${escapeHTML(email)}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:10px;
                        font-weight:bold;
                    ">
                        Phone
                    </td>

                    <td style="
                        padding:10px;
                    ">
                        ${escapeHTML(
                            phone ||
                            "Not provided"
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:10px;
                        font-weight:bold;
                    ">
                        Company
                    </td>

                    <td style="
                        padding:10px;
                    ">
                        ${escapeHTML(
                            company ||
                            "Not provided"
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="
                        padding:10px;
                        font-weight:bold;
                    ">
                        Subject
                    </td>

                    <td style="
                        padding:10px;
                    ">
                        ${escapeHTML(
                            subject ||
                            "General Enquiry"
                        )}
                    </td>
                </tr>

            </table>

            <hr style="
                margin:25px 0;
                border:none;
                border-top:1px solid #e5e7eb;
            ">

            <h3>
                Message
            </h3>

            <div style="
                padding:18px;
                background:#f9fafb;
                border-radius:8px;
                white-space:pre-wrap;
            ">
                ${escapeHTML(message)}
            </div>

            <p style="
                margin-top:25px;
                color:#6b7280;
                font-size:13px;
            ">
                This message was generated automatically by the SPORTING website.
            </p>

        </div>

    </div>

</body>

</html>
`;

        return sendEmail({
            to:
                COMPANY_EMAIL,

            replyTo:
                email,

            subject:
                emailSubject,

            html,

            text:
                `
SPORTING CONTACT MESSAGE

Name: ${name}
Email: ${email}
Phone: ${phone || "Not provided"}
Company: ${company || "Not provided"}
Subject: ${subject || "General Enquiry"}

Message:
${message}
                `.trim()
        });
    };

/*
=========================================================
 SEND APPLICATION EMAIL
=========================================================
*/

const sendApplicationEmail =
    async ({
        name,
        phone,
        email,
        competitionName,
        sport,
        eventDate,
        location,
        expectedParticipants,
        eventType,
        requiredFacilities,
        budget,
        message,
        applicationId
    }) => {

        const subject =
            `SPORTING Event Application - ${competitionName}`;

        const html = `
<!DOCTYPE html>

<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>SPORTING Event Application</title>
</head>

<body style="
    margin:0;
    padding:20px;
    background:#f4f6f8;
    font-family:Arial,Helvetica,sans-serif;
">

<div style="
    max-width:750px;
    margin:auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    border:1px solid #e5e7eb;
">

    <div style="
        padding:28px;
        background:#111827;
        color:#ffffff;
    ">

        <h1 style="margin:0;">
            SPORTING
        </h1>

        <p style="
            margin:8px 0 0;
            color:#d1d5db;
        ">
            New Event Application
        </p>

    </div>

    <div style="padding:28px;">

        <h2>
            ${escapeHTML(
                competitionName
            )}
        </h2>

        <table style="
            width:100%;
            border-collapse:collapse;
        ">

            ${emailRow(
                "Applicant",
                name
            )}

            ${emailRow(
                "Phone",
                phone
            )}

            ${emailRow(
                "Email",
                email
            )}

            ${emailRow(
                "Sport",
                sport
            )}

            ${emailRow(
                "Event Date",
                eventDate
            )}

            ${emailRow(
                "Location",
                location
            )}

            ${emailRow(
                "Expected Participants",
                expectedParticipants
            )}

            ${emailRow(
                "Event Type",
                eventType
            )}

            ${emailRow(
                "Budget",
                budget ||
                "Not provided"
            )}

        </table>

        <hr style="
            margin:25px 0;
            border:none;
            border-top:1px solid #e5e7eb;
        ">

        <h3>
            Required Facilities
        </h3>

        <div style="
            padding:15px;
            background:#f9fafb;
            border-radius:8px;
            white-space:pre-wrap;
        ">
            ${escapeHTML(
                requiredFacilities ||
                "Not specified"
            )}
        </div>

        <h3 style="
            margin-top:24px;
        ">
            Additional Message
        </h3>

        <div style="
            padding:15px;
            background:#f9fafb;
            border-radius:8px;
            white-space:pre-wrap;
        ">
            ${escapeHTML(
                message ||
                "No additional message."
            )}
        </div>

        <p style="
            margin-top:25px;
            color:#6b7280;
            font-size:13px;
        ">
            Application ID:
            ${escapeHTML(
                applicationId
            )}
        </p>

    </div>

</div>

</body>

</html>
`;

        return sendEmail({
            to:
                COMPANY_EMAIL,

            replyTo:
                email,

            subject,

            html,

            text:
                `
SPORTING EVENT APPLICATION

Application ID: ${applicationId}

Applicant: ${name}
Phone: ${phone}
Email: ${email}

Competition: ${competitionName}
Sport: ${sport}
Event Date: ${eventDate}
Location: ${location}
Expected Participants: ${expectedParticipants}
Event Type: ${eventType}

Budget:
${budget || "Not provided"}

Required Facilities:
${requiredFacilities || "Not specified"}

Message:
${message || "No additional message."}
                `.trim()
        });
    };

/*
=========================================================
 SEND PARTICIPANT REGISTRATION EMAIL
=========================================================
*/

const sendParticipantRegistrationEmail =
    async ({
        name,
        email,
        phone,
        event,
        sport,
        age,
        registrationId,
        eventDate,
        location
    }) => {

        const subject =
            `SPORTING Registration Confirmation - ${registrationId}`;

        const html = `
<!DOCTYPE html>

<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>SPORTING Registration</title>
</head>

<body style="
    margin:0;
    padding:20px;
    background:#f4f6f8;
    font-family:Arial,Helvetica,sans-serif;
">

<div style="
    max-width:700px;
    margin:auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    border:1px solid #e5e7eb;
">

    <div style="
        padding:28px;
        background:#111827;
        color:#ffffff;
    ">

        <h1 style="margin:0;">
            SPORTING
        </h1>

        <p style="
            margin:8px 0 0;
            color:#d1d5db;
        ">
            Run. Play. Achieve.
        </p>

    </div>

    <div style="padding:28px;">

        <h2>
            Registration Confirmed
        </h2>

        <p>
            Hello ${escapeHTML(name)},
        </p>

        <p>
            Your participant registration has been received successfully.
        </p>

        <div style="
            margin:22px 0;
            padding:20px;
            background:#f3f4f6;
            border-radius:10px;
            text-align:center;
        ">

            <div style="
                font-size:13px;
                color:#6b7280;
            ">
                Registration ID
            </div>

            <div style="
                margin-top:8px;
                font-size:24px;
                font-weight:bold;
                font-family:monospace;
            ">
                ${escapeHTML(
                    registrationId
                )}
            </div>

        </div>

        <table style="
            width:100%;
            border-collapse:collapse;
        ">

            ${emailRow(
                "Event",
                event
            )}

            ${emailRow(
                "Sport",
                sport
            )}

            ${emailRow(
                "Age",
                age
            )}

            ${emailRow(
                "Event Date",
                eventDate ||
                "To be announced"
            )}

            ${emailRow(
                "Location",
                location ||
                "To be announced"
            )}

            ${emailRow(
                "Phone",
                phone
            )}

            ${emailRow(
                "Email",
                email
            )}

        </table>

        <p style="
            margin-top:25px;
            color:#6b7280;
            font-size:13px;
        ">
            Please keep your registration ID for future communication.
        </p>

        <p style="
            color:#6b7280;
            font-size:13px;
        ">
            SPORTING<br>
            ${escapeHTML(
                COMPANY_EMAIL
            )}
        </p>

    </div>

</div>

</body>

</html>
`;

        return sendEmail({
            to:
                email,

            subject,

            html,

            text:
                `
SPORTING REGISTRATION CONFIRMATION

Hello ${name},

Your registration has been received successfully.

Registration ID: ${registrationId}

Event: ${event}
Sport: ${sport}
Age: ${age}
Event Date: ${eventDate || "To be announced"}
Location: ${location || "To be announced"}

Please keep your registration ID for future communication.

SPORTING
${COMPANY_EMAIL}
                `.trim()
        });
    };

/*
=========================================================
 GENERIC EMAIL ROW
=========================================================
*/

const emailRow =
    (
        label,
        value
    ) => {

        return `
<tr>

    <td style="
        padding:10px;
        font-weight:bold;
        vertical-align:top;
        width:35%;
    ">
        ${escapeHTML(label)}
    </td>

    <td style="
        padding:10px;
        vertical-align:top;
    ">
        ${escapeHTML(
            value
        )}
    </td>

</tr>
`;
    };

/*
=========================================================
 ESCAPE HTML
=========================================================
*/

const escapeHTML =
    (value) => {

        return String(
            value ??
            ""
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
    };

/*
=========================================================
 STRIP HTML
=========================================================
*/

const stripHTML =
    (html) => {

        return String(
            html ||
            ""
        )
            .replace(
                /<style[\s\S]*?<\/style>/gi,
                ""
            )
            .replace(
                /<script[\s\S]*?<\/script>/gi,
                ""
            )
            .replace(
                /<[^>]*>/g,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();
    };

/*
=========================================================
 DEFAULT HTML
=========================================================
*/

const createDefaultHTML =
    (text) => {

        return `
<!DOCTYPE html>

<html>

<head>
    <meta charset="UTF-8">
</head>

<body>

    <div style="
        font-family:Arial,Helvetica,sans-serif;
        white-space:pre-wrap;
    ">
        ${escapeHTML(text)}
    </div>

</body>

</html>
`;
    };

/*
=========================================================
 EXPORT
=========================================================
*/

module.exports = sendEmail;

module.exports.sendEmail =
    sendEmail;

module.exports.sendContactEmail =
    sendContactEmail;

module.exports.sendApplicationEmail =
    sendApplicationEmail;

module.exports.sendParticipantRegistrationEmail =
    sendParticipantRegistrationEmail;

module.exports.verifyEmailConnection =
    verifyEmailConnection;

module.exports.COMPANY_EMAIL =
    COMPANY_EMAIL;
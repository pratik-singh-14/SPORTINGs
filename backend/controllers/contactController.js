/*
=========================================================
 SPORTING - CONTACT CONTROLLER
 File: backend/controllers/contactController.js
=========================================================
*/

const Contact = require("../models/Contact");
const sendEmail = require("../utils/email");

/*
=========================================================
 COMPANY EMAIL
=========================================================
*/

const COMPANY_EMAIL =
    process.env.COMPANY_EMAIL ||
    "singhpratik0143@gmail.com";

/*
=========================================================
 CREATE CONTACT MESSAGE
 POST /api/contacts
=========================================================
*/

const createContact = async (
    req,
    res
) => {
    try {
        const {
            name,
            email,
            phone,
            company,
            subject,
            message
        } = req.body;

        /*
        -------------------------------------------------
        Validate required fields
        -------------------------------------------------
        */

        if (
            !name ||
            !email ||
            !message
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and message are required."
            });
        }

        /*
        -------------------------------------------------
        Normalize values
        -------------------------------------------------
        */

        const normalizedName =
            String(name).trim();

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const normalizedPhone =
            phone
                ? normalizePhone(phone)
                : "";

        const normalizedMessage =
            String(message).trim();

        /*
        -------------------------------------------------
        Validate name
        -------------------------------------------------
        */

        if (
            normalizedName.length <
            2
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid name."
            });
        }

        /*
        -------------------------------------------------
        Validate email
        -------------------------------------------------
        */

        if (
            !isValidEmail(
                normalizedEmail
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address."
            });
        }

        /*
        -------------------------------------------------
        Validate phone if supplied
        -------------------------------------------------
        */

        if (
            phone &&
            !isValidPhone(
                normalizedPhone
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid 10-digit mobile number."
            });
        }

        /*
        -------------------------------------------------
        Validate message
        -------------------------------------------------
        */

        if (
            normalizedMessage.length <
            5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a more detailed message."
            });
        }

        /*
        -------------------------------------------------
        Create contact record
        -------------------------------------------------
        */

        const contact =
            await Contact.create({
                name:
                    normalizedName,

                email:
                    normalizedEmail,

                phone:
                    normalizedPhone,

                company:
                    company
                        ? String(
                              company
                          ).trim()
                        : "",

                subject:
                    subject
                        ? String(
                              subject
                          ).trim()
                        : "",

                message:
                    normalizedMessage,

                status:
                    "new"
            });

        /*
        -------------------------------------------------
        Send notification email to SPORTING
        -------------------------------------------------
        */

        try {
            await sendCompanyNotification(
                contact
            );
        } catch (emailError) {
            console.error(
                "Company contact email failed:",
                emailError.message
            );
        }

        /*
        -------------------------------------------------
        Send acknowledgement to visitor
        -------------------------------------------------
        */

        try {
            await sendVisitorAcknowledgement(
                contact
            );
        } catch (emailError) {
            console.error(
                "Visitor acknowledgement failed:",
                emailError.message
            );
        }

        /*
        -------------------------------------------------
        Success response
        -------------------------------------------------
        */

        return res.status(201).json({
            success: true,

            message:
                "Your message has been sent successfully. The SPORTING team will contact you soon.",

            contactId:
                contact._id,

            contact: {
                id:
                    contact._id,

                name:
                    contact.name,

                email:
                    contact.email,

                subject:
                    contact.subject,

                status:
                    contact.status,

                createdAt:
                    contact.createdAt
            }
        });

    } catch (error) {

        console.error(
            "Create contact error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to send your message. Please try again later."
        });
    }
};

/*
=========================================================
 GET ALL CONTACT MESSAGES
 GET /api/contacts
=========================================================
*/

const getContacts = async (
    req,
    res
) => {
    try {
        const {
            status,
            search
        } = req.query;

        const filter = {};

        /*
        -------------------------------------------------
        Status filter
        -------------------------------------------------
        */

        if (status) {
            filter.status =
                String(status)
                    .trim()
                    .toLowerCase();
        }

        /*
        -------------------------------------------------
        Search
        -------------------------------------------------
        */

        if (search) {
            const regex =
                new RegExp(
                    String(search).trim(),
                    "i"
                );

            filter.$or = [
                {
                    name:
                        regex
                },
                {
                    email:
                        regex
                },
                {
                    phone:
                        regex
                },
                {
                    company:
                        regex
                },
                {
                    subject:
                        regex
                },
                {
                    message:
                        regex
                }
            ];
        }

        const contacts =
            await Contact.find(
                filter
            ).sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count:
                contacts.length,
            contacts
        });

    } catch (error) {

        console.error(
            "Get contacts error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve contact messages."
        });
    }
};

/*
=========================================================
 GET SINGLE CONTACT
 GET /api/contacts/:id
=========================================================
*/

const getContactById =
    async (
        req,
        res
    ) => {
        try {
            const contact =
                await Contact.findById(
                    req.params.id
                );

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Contact message not found."
                });
            }

            return res.status(200).json({
                success: true,
                contact
            });

        } catch (error) {

            console.error(
                "Get contact error:",
                error
            );

            if (
                error.name ===
                "CastError"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid contact ID."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve contact message."
            });
        }
    };

/*
=========================================================
 UPDATE CONTACT STATUS
 PATCH /api/contacts/:id/status
=========================================================
*/

const updateContactStatus =
    async (
        req,
        res
    ) => {
        try {
            const {
                status,
                adminNotes
            } = req.body;

            const allowedStatuses = [
                "new",
                "read",
                "replied",
                "closed"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid contact status."
                });
            }

            const contact =
                await Contact.findById(
                    req.params.id
                );

            if (!contact) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Contact message not found."
                });
            }

            contact.status =
                status;

            if (
                adminNotes !==
                undefined
            ) {
                contact.adminNotes =
                    String(
                        adminNotes
                    ).trim();
            }

            if (
                status ===
                "replied"
            ) {
                contact.repliedAt =
                    new Date();
            }

            await contact.save();

            return res.status(200).json({
                success: true,
                message:
                    "Contact status updated successfully.",
                contact
            });

        } catch (error) {

            console.error(
                "Update contact status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update contact status."
            });
        }
    };

/*
=========================================================
 DELETE CONTACT
 DELETE /api/contacts/:id
=========================================================
*/

const deleteContact = async (
    req,
    res
) => {
    try {
        const contact =
            await Contact.findByIdAndDelete(
                req.params.id
            );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message:
                    "Contact message not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Contact message deleted successfully."
        });

    } catch (error) {

        console.error(
            "Delete contact error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete contact message."
        });
    }
};

/*
=========================================================
 GET NEW CONTACT COUNT
 GET /api/contacts/count
=========================================================
*/

const getContactCount =
    async (
        req,
        res
    ) => {
        try {
            const filter = {};

            if (
                req.query.status
            ) {
                filter.status =
                    String(
                        req.query.status
                    )
                        .trim()
                        .toLowerCase();
            }

            const count =
                await Contact.countDocuments(
                    filter
                );

            return res.status(200).json({
                success: true,
                count
            });

        } catch (error) {

            console.error(
                "Get contact count error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve contact count."
            });
        }
    };

/*
=========================================================
 SEND COMPANY NOTIFICATION
=========================================================
*/

const sendCompanyNotification =
    async (
        contact
    ) => {

        const subject =
            contact.subject
                ? `SPORTING Contact: ${contact.subject}`
                : "New SPORTING Website Contact Message";

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SPORTING Contact Message</title>
</head>

<body style="
    margin:0;
    padding:20px;
    font-family:Arial,sans-serif;
    background:#f4f6f8;
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
        padding:24px;
        background:#111827;
        color:#ffffff;
    ">

        <h1 style="
            margin:0;
            font-size:28px;
        ">
            SPORTING
        </h1>

        <p style="
            margin:6px 0 0;
            color:#d1d5db;
        ">
            New Website Contact Message
        </p>

    </div>

    <div style="
        padding:24px;
    ">

        <h2>
            ${escapeHTML(
                contact.subject ||
                "General Enquiry"
            )}
        </h2>

        <table style="
            width:100%;
            border-collapse:collapse;
        ">

            <tr>
                <td style="
                    padding:8px;
                    font-weight:bold;
                ">
                    Name
                </td>

                <td style="
                    padding:8px;
                ">
                    ${escapeHTML(
                        contact.name
                    )}
                </td>
            </tr>

            <tr>
                <td style="
                    padding:8px;
                    font-weight:bold;
                ">
                    Email
                </td>

                <td style="
                    padding:8px;
                ">
                    ${escapeHTML(
                        contact.email
                    )}
                </td>
            </tr>

            <tr>
                <td style="
                    padding:8px;
                    font-weight:bold;
                ">
                    Phone
                </td>

                <td style="
                    padding:8px;
                ">
                    ${escapeHTML(
                        contact.phone ||
                        "Not provided"
                    )}
                </td>
            </tr>

            <tr>
                <td style="
                    padding:8px;
                    font-weight:bold;
                ">
                    Company
                </td>

                <td style="
                    padding:8px;
                ">
                    ${escapeHTML(
                        contact.company ||
                        "Not provided"
                    )}
                </td>
            </tr>

        </table>

        <hr style="
            margin:24px 0;
            border:none;
            border-top:1px solid #e5e7eb;
        ">

        <h3>
            Message
        </h3>

        <div style="
            padding:16px;
            background:#f9fafb;
            border-radius:8px;
            white-space:pre-wrap;
        ">
            ${escapeHTML(
                contact.message
            )}
        </div>

        <p style="
            margin-top:24px;
            color:#6b7280;
            font-size:13px;
        ">
            Contact ID:
            ${contact._id}
        </p>

        <p style="
            color:#6b7280;
            font-size:13px;
        ">
            Received:
            ${formatDateTime(
                contact.createdAt
            )}
        </p>

    </div>

</div>

</body>
</html>
`;

        await sendEmail({
            to:
                COMPANY_EMAIL,

            replyTo:
                contact.email,

            subject,

            html
        });
    };

/*
=========================================================
 SEND VISITOR ACKNOWLEDGEMENT
=========================================================
*/

const sendVisitorAcknowledgement =
    async (
        contact
    ) => {

        const subject =
            "SPORTING - We received your message";

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SPORTING Message Received</title>
</head>

<body style="
    margin:0;
    padding:20px;
    font-family:Arial,sans-serif;
    background:#f4f6f8;
">

<div style="
    max-width:650px;
    margin:auto;
    background:#ffffff;
    border-radius:12px;
    overflow:hidden;
    border:1px solid #e5e7eb;
">

    <div style="
        padding:24px;
        background:#111827;
        color:#ffffff;
    ">

        <h1 style="
            margin:0;
            font-size:28px;
        ">
            SPORTING
        </h1>

        <p style="
            margin:6px 0 0;
            color:#d1d5db;
        ">
            Run. Play. Achieve.
        </p>

    </div>

    <div style="
        padding:24px;
    ">

        <h2>
            Thank you, ${escapeHTML(
                contact.name
            )}
        </h2>

        <p>
            We have received your message successfully.
        </p>

        <p>
            Our SPORTING team will review your enquiry and contact you as soon as possible.
        </p>

        <div style="
            margin:20px 0;
            padding:16px;
            background:#f3f4f6;
            border-radius:8px;
        ">

            <strong>
                Contact Reference:
            </strong>

            <div style="
                margin-top:8px;
                font-family:monospace;
            ">
                ${contact._id}
            </div>

        </div>

        <p>
            For urgent event enquiries, please contact SPORTING directly.
        </p>

        <p style="
            margin-top:28px;
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

        await sendEmail({
            to:
                contact.email,

            subject,

            html
        });
    };

/*
=========================================================
 EMAIL VALIDATION
=========================================================
*/

function isValidEmail(
    email
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}

/*
=========================================================
 PHONE NORMALIZATION
=========================================================
*/

function normalizePhone(
    phone
) {
    return String(
        phone || ""
    )
        .replace(
            /\D/g,
            ""
        )
        .slice(-10);
}

/*
=========================================================
 PHONE VALIDATION
=========================================================
*/

function isValidPhone(
    phone
) {
    return /^[6-9]\d{9}$/.test(
        phone
    );
}

/*
=========================================================
 ESCAPE HTML
=========================================================
*/

function escapeHTML(
    value
) {
    return String(
        value ?? ""
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

/*
=========================================================
 FORMAT DATE/TIME
=========================================================
*/

function formatDateTime(
    date
) {
    if (!date) {
        return "Not available";
    }

    return new Date(
        date
    ).toLocaleString(
        "en-IN",
        {
            dateStyle:
                "medium",
            timeStyle:
                "short"
        }
    );
}

/*
=========================================================
 EXPORT
=========================================================
*/

module.exports = {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact,
    getContactCount
};
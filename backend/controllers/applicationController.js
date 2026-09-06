/*
=========================================================
 SPORTING - APPLICATION CONTROLLER
 File: backend/controllers/applicationController.js
=========================================================
*/

const Application = require("../models/Application");
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
 CREATE APPLICATION
 POST /api/applications
=========================================================
*/

const createApplication = async (
    req,
    res
) => {
    try {
        const {
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
            message
        } = req.body;

        /*
        -------------------------------------------------
        Validate required fields
        -------------------------------------------------
        */

        if (
            !name ||
            !phone ||
            !email ||
            !competitionName ||
            !sport ||
            !eventDate ||
            !location ||
            expectedParticipants === undefined ||
            expectedParticipants === null ||
            !eventType
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please fill in all required application fields."
            });
        }

        /*
        -------------------------------------------------
        Validate email
        -------------------------------------------------
        */

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(
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
        Validate phone
        -------------------------------------------------
        */

        const normalizedPhone =
            String(phone)
                .replace(/\D/g, "")
                .slice(-10);

        if (
            !/^[6-9]\d{9}$/.test(
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
        Validate participants
        -------------------------------------------------
        */

        const participants =
            Number(
                expectedParticipants
            );

        if (
            !Number.isInteger(
                participants
            ) ||
            participants < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Expected participants must be a valid number greater than 0."
            });
        }

        /*
        -------------------------------------------------
        Validate event date
        -------------------------------------------------
        */

        const parsedEventDate =
            new Date(eventDate);

        if (
            Number.isNaN(
                parsedEventDate.getTime()
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid event date."
            });
        }

        /*
        -------------------------------------------------
        Prevent invalid event type
        -------------------------------------------------
        */

        const allowedEventTypes = [
            "Organizing a Marathon",
            "Organizing any Sports Competition",
            "Hiring SPORTING for Complete Event Management"
        ];

        if (
            !allowedEventTypes.includes(
                eventType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please select a valid event type."
            });
        }

        /*
        -------------------------------------------------
        Create application
        -------------------------------------------------
        */

        const application =
            await Application.create({
                name:
                    String(name).trim(),

                phone:
                    normalizedPhone,

                email:
                    normalizedEmail,

                competitionName:
                    String(
                        competitionName
                    ).trim(),

                sport:
                    String(
                        sport
                    ).trim(),

                eventDate:
                    parsedEventDate,

                location:
                    String(
                        location
                    ).trim(),

                expectedParticipants:
                    participants,

                eventType:
                    String(
                        eventType
                    ).trim(),

                requiredFacilities:
                    requiredFacilities
                        ? String(
                              requiredFacilities
                          ).trim()
                        : "",

                budget:
                    budget
                        ? String(
                              budget
                          ).trim()
                        : "",

                message:
                    message
                        ? String(
                              message
                          ).trim()
                        : "",

                status:
                    "pending"
            });

        /*
        -------------------------------------------------
        Send company email
        -------------------------------------------------
        */

        try {
            await sendApplicationEmail(
                application
            );
        } catch (emailError) {
            /*
             * Do not delete the application if
             * email delivery fails.
             */

            console.error(
                "Application email failed:",
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
                "Your event application has been submitted successfully. The SPORTING team will contact you soon.",

            applicationId:
                application._id,

            application: {
                id:
                    application._id,

                name:
                    application.name,

                competitionName:
                    application.competitionName,

                sport:
                    application.sport,

                eventDate:
                    application.eventDate,

                status:
                    application.status,

                createdAt:
                    application.createdAt
            }
        });

    } catch (error) {

        console.error(
            "Create application error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to submit your event application. Please try again later."
        });
    }
};

/*
=========================================================
 GET ALL APPLICATIONS
 GET /api/applications
=========================================================
*/

const getApplications = async (
    req,
    res
) => {
    try {
        const {
            status,
            sport,
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
        Sport filter
        -------------------------------------------------
        */

        if (sport) {
            filter.sport =
                new RegExp(
                    String(sport).trim(),
                    "i"
                );
        }

        /*
        -------------------------------------------------
        Search filter
        -------------------------------------------------
        */

        if (search) {
            const searchRegex =
                new RegExp(
                    String(search).trim(),
                    "i"
                );

            filter.$or = [
                {
                    name:
                        searchRegex
                },
                {
                    email:
                        searchRegex
                },
                {
                    competitionName:
                        searchRegex
                },
                {
                    sport:
                        searchRegex
                },
                {
                    location:
                        searchRegex
                }
            ];
        }

        const applications =
            await Application.find(
                filter
            ).sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count:
                applications.length,
            applications
        });

    } catch (error) {

        console.error(
            "Get applications error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve applications."
        });
    }
};

/*
=========================================================
 GET SINGLE APPLICATION
 GET /api/applications/:id
=========================================================
*/

const getApplicationById = async (
    req,
    res
) => {
    try {
        const application =
            await Application.findById(
                req.params.id
            );

        if (!application) {
            return res.status(404).json({
                success: false,
                message:
                    "Application not found."
            });
        }

        return res.status(200).json({
            success: true,
            application
        });

    } catch (error) {

        console.error(
            "Get application error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve the application."
        });
    }
};

/*
=========================================================
 UPDATE APPLICATION STATUS
 PUT /api/applications/:id/status
=========================================================
*/

const updateApplicationStatus =
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
                "pending",
                "reviewing",
                "approved",
                "rejected",
                "completed"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid application status."
                });
            }

            const application =
                await Application.findById(
                    req.params.id
                );

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Application not found."
                });
            }

            application.status =
                status;

            if (
                adminNotes !==
                undefined
            ) {
                application.adminNotes =
                    String(
                        adminNotes
                    ).trim();
            }

            application.reviewedAt =
                new Date();

            await application.save();

            return res.status(200).json({
                success: true,
                message:
                    "Application status updated successfully.",
                application
            });

        } catch (error) {

            console.error(
                "Update application status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update application status."
            });
        }
    };

/*
=========================================================
 DELETE APPLICATION
 DELETE /api/applications/:id
=========================================================
*/

const deleteApplication = async (
    req,
    res
) => {
    try {
        const application =
            await Application.findByIdAndDelete(
                req.params.id
            );

        if (!application) {
            return res.status(404).json({
                success: false,
                message:
                    "Application not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Application deleted successfully."
        });

    } catch (error) {

        console.error(
            "Delete application error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete application."
        });
    }
};

/*
=========================================================
 SEND APPLICATION EMAIL
=========================================================
*/

const sendApplicationEmail =
    async (
        application
    ) => {

        const subject =
            `New SPORTING Event Application - ${application.competitionName}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>New SPORTING Event Application</title>
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
                New Event Application
            </p>
        </div>

        <div style="
            padding:24px;
        ">

            <h2>
                ${escapeHTML(
                    application.competitionName
                )}
            </h2>

            <table style="
                width:100%;
                border-collapse:collapse;
            ">

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Applicant
                    </td>
                    <td style="padding:8px;">
                        ${escapeHTML(
                            application.name
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Phone
                    </td>
                    <td style="padding:8px;">
                        ${escapeHTML(
                            application.phone
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Email
                    </td>
                    <td style="padding:8px;">
                        ${escapeHTML(
                            application.email
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Sport
                    </td>
                    <td style="padding:8px;">
                        ${escapeHTML(
                            application.sport
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Event Date
                    </td>
                    <td style="padding:8px;">
                        ${formatEmailDate(
                            application.eventDate
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Location
                    </td>
                    <td style="padding:8px;">
                        ${escapeHTML(
                            application.location
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Participants
                    </td>
                    <td style="padding:8px;">
                        ${application.expectedParticipants}
                    </td>
                </tr>

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Event Type
                    </td>
                    <td style="padding:8px;">
                        ${escapeHTML(
                            application.eventType
                        )}
                    </td>
                </tr>

                <tr>
                    <td style="padding:8px;font-weight:bold;">
                        Budget
                    </td>
                    <td style="padding:8px;">
                        ${escapeHTML(
                            application.budget ||
                            "Not specified"
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
                Required Facilities
            </h3>

            <p>
                ${escapeHTML(
                    application.requiredFacilities ||
                    "Not specified"
                )}
            </p>

            <h3>
                Additional Message
            </h3>

            <p>
                ${escapeHTML(
                    application.message ||
                    "No additional message."
                )}
            </p>

            <p style="
                margin-top:24px;
                color:#6b7280;
                font-size:13px;
            ">
                Application ID:
                ${application._id}
            </p>

        </div>

    </div>

</body>
</html>
`;

        /*
         * The email utility supports the common
         * {to, subject, html} format.
         */

        return sendEmail({
            to:
                COMPANY_EMAIL,

            subject,

            html
        });
    };

/*
=========================================================
 ESCAPE HTML
=========================================================
*/

const escapeHTML = (
    value
) => {
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
};

/*
=========================================================
 FORMAT EMAIL DATE
=========================================================
*/

const formatEmailDate = (
    date
) => {
    if (!date) {
        return "Not specified";
    }

    return new Date(
        date
    ).toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
};

/*
=========================================================
 EXPORT CONTROLLER FUNCTIONS
=========================================================
*/

module.exports = {
    createApplication,
    getApplications,
    getApplicationById,
    updateApplicationStatus,
    deleteApplication
};
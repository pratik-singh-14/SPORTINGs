/*
=========================================================
 SPORTING - PARTICIPANT CONTROLLER
 File: backend/controllers/participantController.js
=========================================================
*/

const Participant = require("../models/Participant");
const Event = require("../models/Event");

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
 REGISTER PARTICIPANT
 POST /api/participants
=========================================================
*/

const registerParticipant = async (
    req,
    res
) => {
    try {
        const {
            name,
            phone,
            email,
            event,
            eventId,
            sport,
            age,
            gender,
            emergencyContactName,
            emergencyPhone,
            address,
            city,
            state,
            category,
            notes
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
            !event ||
            !sport ||
            age === undefined ||
            age === null ||
            !emergencyPhone
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please fill in all required participant fields."
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
            normalizePhone(phone);

        if (
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
        Validate emergency phone
        -------------------------------------------------
        */

        const normalizedEmergencyPhone =
            normalizePhone(
                emergencyPhone
            );

        if (
            !isValidPhone(
                normalizedEmergencyPhone
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid emergency contact number."
            });
        }

        /*
        -------------------------------------------------
        Validate age
        -------------------------------------------------
        */

        const participantAge =
            Number(age);

        if (
            !Number.isInteger(
                participantAge
            ) ||
            participantAge < 5 ||
            participantAge > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid participant age."
            });
        }

        /*
        -------------------------------------------------
        Validate event if eventId is provided
        -------------------------------------------------
        */

        let selectedEvent = null;

        if (eventId) {
            selectedEvent =
                await Event.findById(
                    eventId
                );

            if (!selectedEvent) {
                return res.status(404).json({
                    success: false,
                    message:
                        "The selected event was not found."
                });
            }

            if (
                selectedEvent.status ===
                "cancelled"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Registration is not available for this event."
                });
            }

            if (
                !selectedEvent.registrationOpen
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Registration for this event is currently closed."
                });
            }

            /*
             * Use the actual event details from
             * the database.
             */

            if (
                selectedEvent.title
            ) {
                req.body.event =
                    selectedEvent.title;
            }

            if (
                selectedEvent.sport
            ) {
                req.body.sport =
                    selectedEvent.sport;
            }
        }

        /*
        -------------------------------------------------
        Prevent duplicate registration
        -------------------------------------------------
        */

        const duplicateFilter = {
            email:
                normalizedEmail,
            event:
                String(
                    req.body.event ||
                    event
                ).trim()
        };

        if (eventId) {
            duplicateFilter.eventId =
                eventId;
        }

        const existingParticipant =
            await Participant.findOne(
                duplicateFilter
            );

        if (
            existingParticipant
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "This participant is already registered for this event.",
                registrationId:
                    existingParticipant.registrationId
            });
        }

        /*
        -------------------------------------------------
        Check event participant limit
        -------------------------------------------------
        */

        if (
            selectedEvent &&
            selectedEvent.maxParticipants >
                0
        ) {
            const registeredCount =
                await Participant.countDocuments(
                    {
                        eventId:
                            selectedEvent._id,

                        status: {
                            $nin: [
                                "cancelled"
                            ]
                        }
                    }
                );

            if (
                registeredCount >=
                selectedEvent.maxParticipants
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This event has reached its maximum participant capacity."
                });
            }
        }

        /*
        -------------------------------------------------
        Create participant
        -------------------------------------------------
        */

        const participant =
            await Participant.create({
                name:
                    String(name).trim(),

                phone:
                    normalizedPhone,

                email:
                    normalizedEmail,

                event:
                    String(
                        req.body.event ||
                        event
                    ).trim(),

                eventId:
                    eventId || null,

                sport:
                    String(
                        req.body.sport ||
                        sport
                    ).trim(),

                age:
                    participantAge,

                gender:
                    gender
                        ? String(
                              gender
                          ).trim().toLowerCase()
                        : "",

                emergencyContactName:
                    emergencyContactName
                        ? String(
                              emergencyContactName
                          ).trim()
                        : "",

                emergencyPhone:
                    normalizedEmergencyPhone,

                address:
                    address
                        ? String(
                              address
                          ).trim()
                        : "",

                city:
                    city
                        ? String(
                              city
                          ).trim()
                        : "",

                state:
                    state
                        ? String(
                              state
                          ).trim()
                        : "",

                category:
                    category
                        ? String(
                              category
                          ).trim()
                        : "",

                notes:
                    notes
                        ? String(
                              notes
                          ).trim()
                        : "",

                status:
                    "registered",

                paymentStatus:
                    selectedEvent &&
                    selectedEvent.registrationFee >
                        0
                        ? "pending"
                        : "not_required"
            });

        /*
        -------------------------------------------------
        Update event participant count
        -------------------------------------------------
        */

        if (selectedEvent) {
            await Event.findByIdAndUpdate(
                selectedEvent._id,
                {
                    $inc: {
                        expectedParticipants: 1
                    }
                }
            );
        }

        /*
        -------------------------------------------------
        Send registration email
        -------------------------------------------------
        */

        try {
            await sendRegistrationEmail(
                participant,
                selectedEvent
            );
        } catch (emailError) {
            console.error(
                "Participant email failed:",
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
                "Registration completed successfully.",

            registrationId:
                participant.registrationId,

            participant: {
                id:
                    participant._id,

                registrationId:
                    participant.registrationId,

                name:
                    participant.name,

                email:
                    participant.email,

                event:
                    participant.event,

                sport:
                    participant.sport,

                status:
                    participant.status,

                paymentStatus:
                    participant.paymentStatus,

                createdAt:
                    participant.createdAt
            }
        });

    } catch (error) {
        console.error(
            "Participant registration error:",
            error
        );

        if (
            error.name ===
            "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid event ID."
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to complete registration. Please try again later."
        });
    }
};

/*
=========================================================
 GET ALL PARTICIPANTS
 GET /api/participants
=========================================================
*/

const getParticipants = async (
    req,
    res
) => {
    try {
        const {
            eventId,
            sport,
            status,
            search
        } = req.query;

        const filter = {};

        if (eventId) {
            filter.eventId =
                eventId;
        }

        if (sport) {
            filter.sport =
                new RegExp(
                    String(sport).trim(),
                    "i"
                );
        }

        if (status) {
            filter.status =
                String(status)
                    .trim()
                    .toLowerCase();
        }

        if (search) {
            const regex =
                new RegExp(
                    String(search).trim(),
                    "i"
                );

            filter.$or = [
                {
                    name: regex
                },
                {
                    email: regex
                },
                {
                    phone: regex
                },
                {
                    event: regex
                },
                {
                    registrationId:
                        regex
                }
            ];
        }

        const participants =
            await Participant.find(
                filter
            )
                .populate(
                    "eventId",
                    "title sport eventDate location"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,

            count:
                participants.length,

            participants
        });

    } catch (error) {
        console.error(
            "Get participants error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve participants."
        });
    }
};

/*
=========================================================
 GET SINGLE PARTICIPANT
 GET /api/participants/:id
=========================================================
*/

const getParticipantById =
    async (
        req,
        res
    ) => {
        try {
            const participant =
                await Participant.findById(
                    req.params.id
                ).populate(
                    "eventId",
                    "title sport eventDate location venue"
                );

            if (!participant) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Participant not found."
                });
            }

            return res.status(200).json({
                success: true,
                participant
            });

        } catch (error) {
            console.error(
                "Get participant error:",
                error
            );

            if (
                error.name ===
                "CastError"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid participant ID."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve participant."
            });
        }
    };

/*
=========================================================
 UPDATE PARTICIPANT
 PUT /api/participants/:id
=========================================================
*/

const updateParticipant =
    async (
        req,
        res
    ) => {
        try {
            const participant =
                await Participant.findById(
                    req.params.id
                );

            if (!participant) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Participant not found."
                });
            }

            const allowedFields = [
                "name",
                "phone",
                "email",
                "event",
                "sport",
                "age",
                "gender",
                "emergencyContactName",
                "emergencyPhone",
                "address",
                "city",
                "state",
                "category",
                "status",
                "paymentStatus",
                "paymentReference",
                "bibNumber",
                "notes"
            ];

            allowedFields.forEach(
                field => {
                    if (
                        req.body[field] !==
                        undefined
                    ) {
                        participant[field] =
                            req.body[field];
                    }
                }
            );

            if (
                req.body.phone
            ) {
                const phone =
                    normalizePhone(
                        req.body.phone
                    );

                if (
                    !isValidPhone(
                        phone
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid phone number."
                    });
                }

                participant.phone =
                    phone;
            }

            if (
                req.body.emergencyPhone
            ) {
                const emergencyPhone =
                    normalizePhone(
                        req.body.emergencyPhone
                    );

                if (
                    !isValidPhone(
                        emergencyPhone
                    )
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid emergency phone number."
                    });
                }

                participant.emergencyPhone =
                    emergencyPhone;
            }

            if (
                req.body.email
            ) {
                participant.email =
                    String(
                        req.body.email
                    )
                        .trim()
                        .toLowerCase();
            }

            if (
                req.body.age !==
                undefined
            ) {
                const age =
                    Number(
                        req.body.age
                    );

                if (
                    !Number.isInteger(
                        age
                    ) ||
                    age < 5 ||
                    age > 100
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid age."
                    });
                }

                participant.age =
                    age;
            }

            await participant.save();

            return res.status(200).json({
                success: true,

                message:
                    "Participant updated successfully.",

                participant
            });

        } catch (error) {
            console.error(
                "Update participant error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update participant."
            });
        }
    };

/*
=========================================================
 UPDATE PARTICIPANT STATUS
 PATCH /api/participants/:id/status
=========================================================
*/

const updateParticipantStatus =
    async (
        req,
        res
    ) => {
        try {
            const {
                status
            } = req.body;

            const allowedStatuses = [
                "registered",
                "confirmed",
                "cancelled",
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
                        "Invalid participant status."
                });
            }

            const participant =
                await Participant.findById(
                    req.params.id
                );

            if (!participant) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Participant not found."
                });
            }

            participant.status =
                status;

            await participant.save();

            return res.status(200).json({
                success: true,

                message:
                    "Participant status updated successfully.",

                participant
            });

        } catch (error) {
            console.error(
                "Update participant status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update participant status."
            });
        }
    };

/*
=========================================================
 DELETE PARTICIPANT
 DELETE /api/participants/:id
=========================================================
*/

const deleteParticipant =
    async (
        req,
        res
    ) => {
        try {
            const participant =
                await Participant.findByIdAndDelete(
                    req.params.id
                );

            if (!participant) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Participant not found."
                });
            }

            /*
             * Reduce event participant count if
             * this participant belonged to an event.
             */

            if (
                participant.eventId &&
                participant.status !==
                    "cancelled"
            ) {
                await Event.findByIdAndUpdate(
                    participant.eventId,
                    {
                        $inc: {
                            expectedParticipants:
                                -1
                        }
                    }
                );
            }

            return res.status(200).json({
                success: true,
                message:
                    "Participant deleted successfully."
            });

        } catch (error) {
            console.error(
                "Delete participant error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to delete participant."
            });
        }
    };

/*
=========================================================
 GET PARTICIPANT COUNT
 GET /api/participants/count
=========================================================
*/

const getParticipantCount =
    async (
        req,
        res
    ) => {
        try {
            const filter = {};

            if (
                req.query.eventId
            ) {
                filter.eventId =
                    req.query.eventId;
            }

            if (
                req.query.status
            ) {
                filter.status =
                    req.query.status;
            }

            const count =
                await Participant.countDocuments(
                    filter
                );

            return res.status(200).json({
                success: true,
                count
            });

        } catch (error) {
            console.error(
                "Get participant count error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve participant count."
            });
        }
    };

/*
=========================================================
 SEND REGISTRATION EMAIL
=========================================================
*/

const sendRegistrationEmail =
    async (
        participant,
        selectedEvent
    ) => {

        const eventName =
            selectedEvent?.title ||
            participant.event;

        const eventSport =
            selectedEvent?.sport ||
            participant.sport;

        const eventDate =
            selectedEvent?.eventDate
                ? formatDate(
                      selectedEvent.eventDate
                  )
                : "Not specified";

        const eventLocation =
            selectedEvent?.location ||
            "Not specified";

        const subject =
            `SPORTING Registration Confirmed - ${participant.registrationId}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SPORTING Registration</title>
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
                Participant Registration
            </p>

        </div>

        <div style="
            padding:24px;
        ">

            <h2>
                Registration Successful
            </h2>

            <p>
                Hello ${escapeHTML(
                    participant.name
                )},
            </p>

            <p>
                Your registration for the SPORTING event has been successfully received.
            </p>

            <div style="
                padding:18px;
                background:#f3f4f6;
                border-radius:8px;
                margin:20px 0;
            ">

                <p style="margin:6px 0;">
                    <strong>Registration ID:</strong>
                    ${escapeHTML(
                        participant.registrationId
                    )}
                </p>

                <p style="margin:6px 0;">
                    <strong>Event:</strong>
                    ${escapeHTML(
                        eventName
                    )}
                </p>

                <p style="margin:6px 0;">
                    <strong>Sport:</strong>
                    ${escapeHTML(
                        eventSport
                    )}
                </p>

                <p style="margin:6px 0;">
                    <strong>Date:</strong>
                    ${escapeHTML(
                        eventDate
                    )}
                </p>

                <p style="margin:6px 0;">
                    <strong>Location:</strong>
                    ${escapeHTML(
                        eventLocation
                    )}
                </p>

                <p style="margin:6px 0;">
                    <strong>Participant:</strong>
                    ${escapeHTML(
                        participant.name
                    )}
                </p>

            </div>

            <p>
                Please keep your registration ID for future reference.
            </p>

            <p style="
                color:#6b7280;
                font-size:13px;
                margin-top:25px;
            ">
                SPORTING<br>
                Run. Play. Achieve.
            </p>

        </div>

    </div>

</body>
</html>
`;

        /*
         * Send confirmation to the participant.
         */

        const participantEmail =
            participant.email;

        const sendEmail =
            require("../utils/email");

        await sendEmail({
            to:
                participantEmail,

            subject,

            html
        });

        /*
         * Also notify the company.
         */

        await sendEmail({
            to:
                COMPANY_EMAIL,

            subject:
                `New SPORTING Participant - ${participant.registrationId}`,

            html
        });
    };

/*
=========================================================
 NORMALIZE PHONE
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
 VALIDATE PHONE
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
 FORMAT DATE
=========================================================
*/

function formatDate(
    date
) {
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
}

/*
=========================================================
 EXPORT
=========================================================
*/

module.exports = {
    registerParticipant,
    getParticipants,
    getParticipantById,
    updateParticipant,
    updateParticipantStatus,
    deleteParticipant,
    getParticipantCount
};
/*
=========================================================
 SPORTING - EVENT CONTROLLER
 File: backend/controllers/eventController.js
=========================================================
*/

const Event = require("../models/Event");

/*
=========================================================
 CREATE EVENT
 POST /api/events
=========================================================
*/

const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            sport,
            eventDate,
            endDate,
            location,
            venue,
            expectedParticipants,
            maxParticipants,
            registrationFee,
            image,
            organizer,
            contactEmail,
            contactPhone,
            registrationOpen,
            registrationDeadline,
            featured,
            rules,
            facilities,
            prizes,
            gallery
        } = req.body;

        if (
            !title ||
            !sport ||
            !eventDate ||
            !location
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Title, sport, event date and location are required."
            });
        }

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

        let parsedEndDate = null;

        if (endDate) {
            parsedEndDate =
                new Date(endDate);

            if (
                Number.isNaN(
                    parsedEndDate.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please provide a valid end date."
                });
            }

            if (
                parsedEndDate <
                parsedEventDate
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "End date cannot be before the event date."
                });
            }
        }

        const event =
            await Event.create({
                title:
                    String(title).trim(),

                description:
                    description
                        ? String(
                              description
                          ).trim()
                        : "",

                sport:
                    String(sport).trim(),

                eventDate:
                    parsedEventDate,

                endDate:
                    parsedEndDate,

                location:
                    String(location).trim(),

                venue:
                    venue
                        ? String(
                              venue
                          ).trim()
                        : "",

                expectedParticipants:
                    toNumber(
                        expectedParticipants
                    ),

                maxParticipants:
                    toNumber(
                        maxParticipants
                    ),

                registrationFee:
                    toNumber(
                        registrationFee
                    ),

                image:
                    image
                        ? String(
                              image
                          ).trim()
                        : "",

                organizer:
                    organizer
                        ? String(
                              organizer
                          ).trim()
                        : "SPORTING",

                contactEmail:
                    contactEmail
                        ? String(
                              contactEmail
                          )
                            .trim()
                            .toLowerCase()
                        : process.env.COMPANY_EMAIL ||
                          "singhpratik0143@gmail.com",

                contactPhone:
                    contactPhone
                        ? String(
                              contactPhone
                          ).trim()
                        : "",

                registrationOpen:
                    registrationOpen !==
                    undefined
                        ? Boolean(
                              registrationOpen
                          )
                        : true,

                registrationDeadline:
                    registrationDeadline
                        ? new Date(
                              registrationDeadline
                          )
                        : null,

                featured:
                    featured !==
                    undefined
                        ? Boolean(
                              featured
                          )
                        : false,

                rules:
                    normalizeArray(
                        rules
                    ),

                facilities:
                    normalizeArray(
                        facilities
                    ),

                prizes:
                    normalizeArray(
                        prizes
                    ),

                gallery:
                    normalizeArray(
                        gallery
                    )
            });

        return res.status(201).json({
            success: true,
            message:
                "Event created successfully.",
            event
        });

    } catch (error) {
        console.error(
            "Create event error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create event."
        });
    }
};

/*
=========================================================
 GET ALL EVENTS
 GET /api/events
=========================================================
*/

const getEvents = async (req, res) => {
    try {
        const {
            sport,
            status,
            featured,
            search
        } = req.query;

        const filter = {};

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

        if (
            featured !==
            undefined
        ) {
            filter.featured =
                featured === "true";
        }

        if (search) {
            const regex =
                new RegExp(
                    String(search).trim(),
                    "i"
                );

            filter.$or = [
                {
                    title: regex
                },
                {
                    description: regex
                },
                {
                    sport: regex
                },
                {
                    location: regex
                },
                {
                    venue: regex
                }
            ];
        }

        const events =
            await Event.find(
                filter
            ).sort({
                eventDate: 1
            });

        return res.status(200).json({
            success: true,
            count:
                events.length,
            events
        });

    } catch (error) {
        console.error(
            "Get events error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve events."
        });
    }
};

/*
=========================================================
 GET SINGLE EVENT
 GET /api/events/:id
=========================================================
*/

const getEventById = async (
    req,
    res
) => {
    try {
        const event =
            await Event.findById(
                req.params.id
            );

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found."
            });
        }

        return res.status(200).json({
            success: true,
            event
        });

    } catch (error) {
        console.error(
            "Get event error:",
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
                "Unable to retrieve event."
        });
    }
};

/*
=========================================================
 UPDATE EVENT
 PUT /api/events/:id
=========================================================
*/

const updateEvent = async (
    req,
    res
) => {
    try {
        const event =
            await Event.findById(
                req.params.id
            );

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found."
            });
        }

        const allowedFields = [
            "title",
            "description",
            "sport",
            "eventDate",
            "endDate",
            "location",
            "venue",
            "expectedParticipants",
            "maxParticipants",
            "registrationFee",
            "image",
            "organizer",
            "contactEmail",
            "contactPhone",
            "registrationOpen",
            "registrationDeadline",
            "featured",
            "rules",
            "facilities",
            "prizes",
            "gallery",
            "status"
        ];

        allowedFields.forEach(
            field => {
                if (
                    req.body[field] !==
                    undefined
                ) {
                    event[field] =
                        req.body[field];
                }
            }
        );

        if (
            req.body.eventDate
        ) {
            const date =
                new Date(
                    req.body.eventDate
                );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid event date."
                });
            }

            event.eventDate =
                date;
        }

        if (
            req.body.endDate
        ) {
            const date =
                new Date(
                    req.body.endDate
                );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid end date."
                });
            }

            event.endDate =
                date;
        }

        if (
            event.endDate &&
            event.endDate <
                event.eventDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "End date cannot be before the event date."
            });
        }

        if (
            req.body.rules !==
            undefined
        ) {
            event.rules =
                normalizeArray(
                    req.body.rules
                );
        }

        if (
            req.body.facilities !==
            undefined
        ) {
            event.facilities =
                normalizeArray(
                    req.body.facilities
                );
        }

        if (
            req.body.prizes !==
            undefined
        ) {
            event.prizes =
                normalizeArray(
                    req.body.prizes
                );
        }

        if (
            req.body.gallery !==
            undefined
        ) {
            event.gallery =
                normalizeArray(
                    req.body.gallery
                );
        }

        if (
            req.body.contactEmail
        ) {
            event.contactEmail =
                String(
                    req.body.contactEmail
                )
                    .trim()
                    .toLowerCase();
        }

        await event.save();

        return res.status(200).json({
            success: true,
            message:
                "Event updated successfully.",
            event
        });

    } catch (error) {
        console.error(
            "Update event error:",
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
                "Unable to update event."
        });
    }
};

/*
=========================================================
 UPDATE EVENT STATUS
 PATCH /api/events/:id/status
=========================================================
*/

const updateEventStatus =
    async (
        req,
        res
    ) => {
        try {
            const {
                status
            } = req.body;

            const allowedStatuses = [
                "upcoming",
                "ongoing",
                "completed",
                "cancelled"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid event status."
                });
            }

            const event =
                await Event.findById(
                    req.params.id
                );

            if (!event) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Event not found."
                });
            }

            event.status =
                status;

            if (
                status ===
                "cancelled"
            ) {
                event.registrationOpen =
                    false;
            }

            await event.save();

            return res.status(200).json({
                success: true,
                message:
                    "Event status updated successfully.",
                event
            });

        } catch (error) {
            console.error(
                "Update event status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to update event status."
            });
        }
    };

/*
=========================================================
 DELETE EVENT
 DELETE /api/events/:id
=========================================================
*/

const deleteEvent = async (
    req,
    res
) => {
    try {
        const event =
            await Event.findByIdAndDelete(
                req.params.id
            );

        if (!event) {
            return res.status(404).json({
                success: false,
                message:
                    "Event not found."
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Event deleted successfully."
        });

    } catch (error) {
        console.error(
            "Delete event error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete event."
        });
    }
};

/*
=========================================================
 GET UPCOMING EVENTS
 GET /api/events/upcoming
=========================================================
*/

const getUpcomingEvents =
    async (
        req,
        res
    ) => {
        try {
            const events =
                await Event.find({
                    eventDate: {
                        $gte:
                            new Date()
                    },

                    status: {
                        $ne:
                            "cancelled"
                    }
                })
                    .sort({
                        eventDate: 1
                    })
                    .limit(
                        Number(
                            req.query.limit
                        ) || 10
                    );

            return res.status(200).json({
                success: true,
                count:
                    events.length,
                events
            });

        } catch (error) {
            console.error(
                "Get upcoming events error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to retrieve upcoming events."
            });
        }
    };

/*
=========================================================
 HELPER: NUMBER
=========================================================
*/

function toNumber(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return 0;
    }

    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : 0;
}

/*
=========================================================
 HELPER: ARRAY
=========================================================
*/

function normalizeArray(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return [];
    }

    if (Array.isArray(value)) {
        return value
            .map(item =>
                String(item).trim()
            )
            .filter(Boolean);
    }

    if (
        typeof value ===
        "string"
    ) {
        return value
            .split(",")
            .map(item =>
                item.trim()
            )
            .filter(Boolean);
    }

    return [];
}

/*
=========================================================
 EXPORT
=========================================================
*/

module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    getUpcomingEvents
};
/*
=========================================================
 SPORTING - EVENT ROUTES
 File: backend/routes/eventRoutes.js
=========================================================
*/

const express = require("express");

const router =
    express.Router();

const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    updateEventStatus,
    deleteEvent,
    getUpcomingEvents
} = require("../controllers/eventController");

const {
    protect,
    requireAdmin
} = require("../middleware/authMiddleware");

/*
=========================================================
 GET UPCOMING EVENTS
 GET /api/events/upcoming

 Public route
=========================================================
*/

router.get(
    "/upcoming",
    getUpcomingEvents
);

/*
=========================================================
 GET ALL EVENTS
 GET /api/events

 Public route
=========================================================
*/

router.get(
    "/",
    getEvents
);

/*
=========================================================
 GET SINGLE EVENT
 GET /api/events/:id

 Public route
=========================================================
*/

router.get(
    "/:id",
    getEventById
);

/*
=========================================================
 CREATE EVENT
 POST /api/events

 Admin only
=========================================================
*/

router.post(
    "/",
    protect,
    requireAdmin,
    createEvent
);

/*
=========================================================
 UPDATE EVENT
 PUT /api/events/:id

 Admin only
=========================================================
*/

router.put(
    "/:id",
    protect,
    requireAdmin,
    updateEvent
);

/*
=========================================================
 UPDATE EVENT STATUS
 PATCH /api/events/:id/status

 Admin only
=========================================================
*/

router.patch(
    "/:id/status",
    protect,
    requireAdmin,
    updateEventStatus
);

/*
=========================================================
 DELETE EVENT
 DELETE /api/events/:id

 Admin only
=========================================================
*/

router.delete(
    "/:id",
    protect,
    requireAdmin,
    deleteEvent
);

/*
=========================================================
 EXPORT ROUTER
=========================================================
*/

module.exports = router;
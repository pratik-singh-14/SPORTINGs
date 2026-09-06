/*
=========================================================
 SPORTING - PARTICIPANT ROUTES
 File: backend/routes/participantRoutes.js
=========================================================
*/

const express = require("express");

const router =
    express.Router();

const {
    registerParticipant,
    getParticipants,
    getParticipantById,
    updateParticipant,
    updateParticipantStatus,
    deleteParticipant,
    getParticipantCount
} = require("../controllers/participantController");

const {
    protect,
    requireAdmin
} = require("../middleware/authMiddleware");

/*
=========================================================
 PARTICIPANT COUNT
 GET /api/participants/count

 Public route
=========================================================
*/

router.get(
    "/count",
    getParticipantCount
);

/*
=========================================================
 REGISTER PARTICIPANT
 POST /api/participants

 Public route
=========================================================
*/

router.post(
    "/",
    registerParticipant
);

/*
=========================================================
 GET ALL PARTICIPANTS
 GET /api/participants

 Admin only
=========================================================
*/

router.get(
    "/",
    protect,
    requireAdmin,
    getParticipants
);

/*
=========================================================
 GET SINGLE PARTICIPANT
 GET /api/participants/:id

 Admin only
=========================================================
*/

router.get(
    "/:id",
    protect,
    requireAdmin,
    getParticipantById
);

/*
=========================================================
 UPDATE PARTICIPANT
 PUT /api/participants/:id

 Admin only
=========================================================
*/

router.put(
    "/:id",
    protect,
    requireAdmin,
    updateParticipant
);

/*
=========================================================
 UPDATE PARTICIPANT STATUS
 PATCH /api/participants/:id/status

 Admin only
=========================================================
*/

router.patch(
    "/:id/status",
    protect,
    requireAdmin,
    updateParticipantStatus
);

/*
=========================================================
 DELETE PARTICIPANT
 DELETE /api/participants/:id

 Admin only
=========================================================
*/

router.delete(
    "/:id",
    protect,
    requireAdmin,
    deleteParticipant
);

/*
=========================================================
 EXPORT ROUTER
=========================================================
*/

module.exports = router;
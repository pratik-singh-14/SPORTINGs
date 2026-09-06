/*
=========================================================
 SPORTING - CONTACT ROUTES
 File: backend/routes/contactRoutes.js
=========================================================
*/

const express = require("express");

const router =
    express.Router();

const {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    deleteContact,
    getContactCount
} = require("../controllers/contactController");

const {
    protect,
    requireAdmin
} = require("../middleware/authMiddleware");

/*
=========================================================
 GET CONTACT COUNT
 GET /api/contacts/count

 Admin only
=========================================================
*/

router.get(
    "/count",
    protect,
    requireAdmin,
    getContactCount
);

/*
=========================================================
 CREATE CONTACT MESSAGE
 POST /api/contacts

 Public route
=========================================================
*/

router.post(
    "/",
    createContact
);

/*
=========================================================
 GET ALL CONTACT MESSAGES
 GET /api/contacts

 Admin only
=========================================================
*/

router.get(
    "/",
    protect,
    requireAdmin,
    getContacts
);

/*
=========================================================
 GET SINGLE CONTACT MESSAGE
 GET /api/contacts/:id

 Admin only
=========================================================
*/

router.get(
    "/:id",
    protect,
    requireAdmin,
    getContactById
);

/*
=========================================================
 UPDATE CONTACT STATUS
 PATCH /api/contacts/:id/status

 Admin only
=========================================================
*/

router.patch(
    "/:id/status",
    protect,
    requireAdmin,
    updateContactStatus
);

/*
=========================================================
 DELETE CONTACT MESSAGE
 DELETE /api/contacts/:id

 Admin only
=========================================================
*/

router.delete(
    "/:id",
    protect,
    requireAdmin,
    deleteContact
);

/*
=========================================================
 EXPORT ROUTER
=========================================================
*/

module.exports = router;
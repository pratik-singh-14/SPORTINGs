/*
=========================================================
 SPORTING - APPLICATION ROUTES
 File: backend/routes/applicationRoutes.js
=========================================================
*/

const express = require("express");

const router =
    express.Router();

const {
    createApplication,
    getApplications,
    getApplicationById,
    updateApplicationStatus,
    deleteApplication
} = require("../controllers/applicationController");

const {
    protect,
    requireAdmin
} = require("../middleware/authMiddleware");

/*
=========================================================
 CREATE EVENT APPLICATION
 POST /api/applications

 Public route
=========================================================
*/

router.post(
    "/",
    createApplication
);

/*
=========================================================
 GET ALL APPLICATIONS
 GET /api/applications

 Admin only
=========================================================
*/

router.get(
    "/",
    protect,
    requireAdmin,
    getApplications
);

/*
=========================================================
 GET SINGLE APPLICATION
 GET /api/applications/:id

 Admin only
=========================================================
*/

router.get(
    "/:id",
    protect,
    requireAdmin,
    getApplicationById
);

/*
=========================================================
 UPDATE APPLICATION STATUS
 PATCH /api/applications/:id/status

 Admin only
=========================================================
*/

router.patch(
    "/:id/status",
    protect,
    requireAdmin,
    updateApplicationStatus
);

/*
=========================================================
 DELETE APPLICATION
 DELETE /api/applications/:id

 Admin only
=========================================================
*/

router.delete(
    "/:id",
    protect,
    requireAdmin,
    deleteApplication
);

/*
=========================================================
 EXPORT ROUTER
=========================================================
*/

module.exports = router;
/*
=========================================================
 SPORTING - AUTH ROUTES
 File: backend/routes/authRoutes.js
=========================================================
*/

const express = require("express");

const router =
    express.Router();

const {
    loginAdmin,
    getCurrentAdmin,
    createAdmin,
    changePassword
} = require("../controllers/authController");

const {
    protect,
    requireSuperAdmin
} = require("../middleware/authMiddleware");

/*
=========================================================
 ADMIN LOGIN
 POST /api/auth/login
=========================================================
*/

router.post(
    "/login",
    loginAdmin
);

/*
=========================================================
 GET CURRENT ADMIN
 GET /api/auth/me
=========================================================
*/

router.get(
    "/me",
    protect,
    getCurrentAdmin
);

/*
=========================================================
 CREATE ADMIN
 POST /api/auth/create
 Protected - Super Admin only
=========================================================
*/

router.post(
    "/create",
    protect,
    requireSuperAdmin,
    createAdmin
);

/*
=========================================================
 CHANGE ADMIN PASSWORD
 PUT /api/auth/change-password
 Protected
=========================================================
*/

router.put(
    "/change-password",
    protect,
    changePassword
);

/*
=========================================================
 EXPORT ROUTER
=========================================================
*/

module.exports = router;
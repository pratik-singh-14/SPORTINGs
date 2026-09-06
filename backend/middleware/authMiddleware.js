/*
=========================================================
 SPORTING - AUTHENTICATION MIDDLEWARE
 File: backend/middleware/authMiddleware.js
=========================================================
*/

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

/*
=========================================================
 VERIFY ADMIN JWT
=========================================================
*/

const protect = async (
    req,
    res,
    next
) => {
    try {
        /*
        -------------------------------------------------
        Get Authorization header
        -------------------------------------------------
        */

        const authHeader =
            req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer "
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required. Please log in as an admin."
            });
        }

        /*
        -------------------------------------------------
        Extract token
        -------------------------------------------------
        */

        const token =
            authHeader
                .split(" ")[1]
                ?.trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication token is missing."
            });
        }

        /*
        -------------------------------------------------
        JWT secret
        -------------------------------------------------
        */

        const jwtSecret =
            process.env.JWT_SECRET;

        if (!jwtSecret) {
            console.error(
                "JWT_SECRET is missing from .env"
            );

            return res.status(500).json({
                success: false,
                message:
                    "Server authentication configuration is missing."
            });
        }

        /*
        -------------------------------------------------
        Verify token
        -------------------------------------------------
        */

        let decoded;

        try {
            decoded =
                jwt.verify(
                    token,
                    jwtSecret
                );
        } catch (jwtError) {

            if (
                jwtError.name ===
                "TokenExpiredError"
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Your admin session has expired. Please log in again."
                });
            }

            return res.status(401).json({
                success: false,
                message:
                    "Invalid authentication token."
            });
        }

        /*
        -------------------------------------------------
        Find admin
        -------------------------------------------------
        */

        const adminId =
            decoded.id ||
            decoded._id ||
            decoded.adminId;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authentication token."
            });
        }

        const admin =
            await Admin.findById(
                adminId
            );

        if (!admin) {
            return res.status(401).json({
                success: false,
                message:
                    "Admin account not found."
            });
        }

        /*
        -------------------------------------------------
        Check active status
        -------------------------------------------------
        */

        if (
            admin.isActive ===
            false
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "This admin account has been deactivated."
            });
        }

        /*
        -------------------------------------------------
        Attach admin to request
        -------------------------------------------------
        */

        req.admin = admin;

        /*
        -------------------------------------------------
        Continue
        -------------------------------------------------
        */

        next();

    } catch (error) {

        console.error(
            "Authentication middleware error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Authentication verification failed."
        });
    }
};

/*
=========================================================
 ADMIN ROLE CHECK
=========================================================
*/

const requireAdmin =
    async (
        req,
        res,
        next
    ) => {

        try {
            if (!req.admin) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required."
                });
            }

            if (
                req.admin.role !==
                    "admin" &&
                req.admin.role !==
                    "superadmin"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Admin access required."
                });
            }

            next();

        } catch (error) {

            console.error(
                "Admin role check error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to verify admin permissions."
            });
        }
    };

/*
=========================================================
 SUPER ADMIN ROLE CHECK
=========================================================
*/

const requireSuperAdmin =
    async (
        req,
        res,
        next
    ) => {

        try {
            if (!req.admin) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Authentication required."
                });
            }

            if (
                req.admin.role !==
                "superadmin"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Super admin access required."
                });
            }

            next();

        } catch (error) {

            console.error(
                "Super admin role check error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to verify permissions."
            });
        }
    };

/*
=========================================================
 OPTIONAL AUTHENTICATION
 Does not block unauthenticated requests.
=========================================================
*/

const optionalAuth =
    async (
        req,
        res,
        next
    ) => {

        try {
            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith(
                    "Bearer "
                )
            ) {
                req.admin = null;
                return next();
            }

            const token =
                authHeader
                    .split(" ")[1]
                    ?.trim();

            if (!token) {
                req.admin = null;
                return next();
            }

            const jwtSecret =
                process.env.JWT_SECRET;

            if (!jwtSecret) {
                req.admin = null;
                return next();
            }

            const decoded =
                jwt.verify(
                    token,
                    jwtSecret
                );

            const adminId =
                decoded.id ||
                decoded._id ||
                decoded.adminId;

            if (!adminId) {
                req.admin = null;
                return next();
            }

            const admin =
                await Admin.findById(
                    adminId
                );

            if (
                admin &&
                admin.isActive !== false
            ) {
                req.admin = admin;
            } else {
                req.admin = null;
            }

            next();

        } catch (error) {
            req.admin = null;
            next();
        }
    };

/*
=========================================================
 EXPORT
=========================================================
*/

module.exports = {
    protect,
    requireAdmin,
    requireSuperAdmin,
    optionalAuth
};
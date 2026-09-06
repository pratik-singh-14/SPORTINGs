/*
=========================================================
 SPORTING - AUTH CONTROLLER
 File: backend/controllers/authController.js
=========================================================
*/

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

/*
=========================================================
 JWT SECRET
=========================================================
*/

const getJWTSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error(
            "JWT_SECRET is missing from the .env file."
        );
    }

    return process.env.JWT_SECRET;
};

/*
=========================================================
 CREATE JWT TOKEN
=========================================================
*/

const createToken = (admin) => {
    return jwt.sign(
        {
            id: admin._id,
            email: admin.email,
            role: admin.role
        },
        getJWTSecret(),
        {
            expiresIn:
                process.env.JWT_EXPIRES_IN ||
                "7d"
        }
    );
};

/*
=========================================================
 ADMIN LOGIN
 POST /api/auth/login
=========================================================
*/

const loginAdmin = async (
    req,
    res
) => {
    try {
        const {
            email,
            password
        } = req.body;

        /*
         * Validate input
         */

        if (
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }

        /*
         * Find admin
         */

        const admin =
            await Admin.findOne({
                email:
                    email
                        .trim()
                        .toLowerCase()
            });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        /*
         * Check active status
         */

        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message:
                    "This admin account is inactive."
            });
        }

        /*
         * Compare password
         */

        const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        /*
         * Update last login
         */

        admin.lastLogin =
            new Date();

        await admin.save();

        /*
         * Create token
         */

        const token =
            createToken(admin);

        /*
         * Send response
         */

        return res.status(200).json({
            success: true,
            message:
                "Admin login successful.",

            token,

            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isActive:
                    admin.isActive,
                lastLogin:
                    admin.lastLogin
            }
        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error during admin login.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined
        });
    }
};

/*
=========================================================
 GET CURRENT ADMIN
 GET /api/auth/me
=========================================================
*/

const getCurrentAdmin = async (
    req,
    res
) => {
    try {
        /*
         * authMiddleware should place the
         * admin ID inside req.admin.id
         */

        const adminId =
            req.admin?.id ||
            req.admin?._id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required."
            });
        }

        const admin =
            await Admin.findById(
                adminId
            );

        if (!admin) {
            return res.status(404).json({
                success: false,
                message:
                    "Admin account not found."
            });
        }

        return res.status(200).json({
            success: true,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isActive:
                    admin.isActive,
                lastLogin:
                    admin.lastLogin,
                createdAt:
                    admin.createdAt
            }
        });

    } catch (error) {

        console.error(
            "Get current admin error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve admin information."
        });
    }
};

/*
=========================================================
 CREATE ADMIN
 POST /api/auth/create-admin
=========================================================
*/

const createAdmin = async (
    req,
    res
) => {
    try {
        const {
            name,
            email,
            password,
            role
        } = req.body;

        /*
         * Validate required fields
         */

        if (
            !name ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, email and password are required."
            });
        }

        /*
         * Validate password length
         */

        if (
            password.length <
            6
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters."
            });
        }

        const normalizedEmail =
            email
                .trim()
                .toLowerCase();

        /*
         * Check existing admin
         */

        const existingAdmin =
            await Admin.findOne({
                email:
                    normalizedEmail
            });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message:
                    "An admin with this email already exists."
            });
        }

        /*
         * Hash password
         */

        const salt =
            await bcrypt.genSalt(12);

        const hashedPassword =
            await bcrypt.hash(
                password,
                salt
            );

        /*
         * Create admin
         */

        const admin =
            await Admin.create({
                name:
                    name.trim(),

                email:
                    normalizedEmail,

                password:
                    hashedPassword,

                role:
                    role ===
                    "superadmin"
                        ? "superadmin"
                        : "admin"
            });

        return res.status(201).json({
            success: true,
            message:
                "Admin account created successfully.",

            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                isActive:
                    admin.isActive
            }
        });

    } catch (error) {

        console.error(
            "Create admin error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create admin account."
        });
    }
};

/*
=========================================================
 CHANGE ADMIN PASSWORD
 PUT /api/auth/change-password
=========================================================
*/

const changePassword = async (
    req,
    res
) => {
    try {
        const {
            currentPassword,
            newPassword
        } = req.body;

        const adminId =
            req.admin?.id ||
            req.admin?._id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required."
            });
        }

        if (
            !currentPassword ||
            !newPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Current password and new password are required."
            });
        }

        if (
            newPassword.length <
            6
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "New password must contain at least 6 characters."
            });
        }

        const admin =
            await Admin.findById(
                adminId
            );

        if (!admin) {
            return res.status(404).json({
                success: false,
                message:
                    "Admin account not found."
            });
        }

        const currentPasswordMatch =
            await bcrypt.compare(
                currentPassword,
                admin.password
            );

        if (
            !currentPasswordMatch
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Current password is incorrect."
            });
        }

        const salt =
            await bcrypt.genSalt(12);

        admin.password =
            await bcrypt.hash(
                newPassword,
                salt
            );

        await admin.save();

        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully."
        });

    } catch (error) {

        console.error(
            "Change password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to change password."
        });
    }
};

/*
=========================================================
 EXPORT CONTROLLER FUNCTIONS
=========================================================
*/

module.exports = {
    loginAdmin,
    getCurrentAdmin,
    createAdmin,
    changePassword,
    createToken
};
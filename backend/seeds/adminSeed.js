/*
=========================================================
 SPORTING - ADMIN SEED
 File: backend/seeds/adminSeed.js
=========================================================
*/

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

/*
=========================================================
 ADMIN DETAILS
=========================================================
*/

const ADMIN_NAME =
    process.env.ADMIN_NAME ||
    "SPORTING Admin";

const ADMIN_EMAIL =
    process.env.ADMIN_EMAIL ||
    "singhpratik0143@gmail.com";

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD;

/*
=========================================================
 VALIDATE CONFIGURATION
=========================================================
*/

if (!ADMIN_PASSWORD) {
    console.error(
        "\nADMIN_PASSWORD is missing from the .env file."
    );

    console.error(
        "Add ADMIN_PASSWORD before running the admin seed.\n"
    );

    process.exit(1);
}

/*
=========================================================
 CONNECT TO DATABASE
=========================================================
*/

const connectDatabase =
    async () => {

        try {

            if (!process.env.MONGO_URI) {
                throw new Error(
                    "MONGO_URI is missing from .env."
                );
            }

            await mongoose.connect(
                process.env.MONGO_URI
            );

            console.log(
                "MongoDB connected successfully."
            );

        } catch (error) {

            console.error(
                "MongoDB connection failed:"
            );

            console.error(
                error.message
            );

            process.exit(1);
        }
    };

/*
=========================================================
 CREATE / UPDATE ADMIN
=========================================================
*/

const seedAdmin =
    async () => {

        try {

            /*
            -------------------------------------------------
            Find existing admin
            -------------------------------------------------
            */

            const existingAdmin =
                await Admin.findOne({
                    email:
                        ADMIN_EMAIL
                            .trim()
                            .toLowerCase()
                });

            /*
            -------------------------------------------------
            If admin already exists
            -------------------------------------------------
            */

            if (existingAdmin) {

                console.log(
                    "\nAdmin account already exists."
                );

                console.log(
                    `Email: ${existingAdmin.email}`
                );

                /*
                -------------------------------------------------
                Ask whether to update password through environment
                -------------------------------------------------
                */

                const passwordMatches =
                    await bcrypt.compare(
                        ADMIN_PASSWORD,
                        existingAdmin.password
                    );

                if (
                    !passwordMatches
                ) {

                    const hashedPassword =
                        await bcrypt.hash(
                            ADMIN_PASSWORD,
                            12
                        );

                    existingAdmin.password =
                        hashedPassword;

                    existingAdmin.name =
                        ADMIN_NAME;

                    existingAdmin.isActive =
                        true;

                    await existingAdmin.save();

                    console.log(
                        "Admin password was updated successfully."
                    );

                } else {

                    console.log(
                        "Existing admin password is already correct."
                    );
                }

                console.log(
                    `Role: ${existingAdmin.role}`
                );

                return;
            }

            /*
            -------------------------------------------------
            Hash password
            -------------------------------------------------
            */

            const hashedPassword =
                await bcrypt.hash(
                    ADMIN_PASSWORD,
                    12
                );

            /*
            -------------------------------------------------
            Create admin
            -------------------------------------------------
            */

            const admin =
                await Admin.create({

                    name:
                        ADMIN_NAME
                            .trim(),

                    email:
                        ADMIN_EMAIL
                            .trim()
                            .toLowerCase(),

                    password:
                        hashedPassword,

                    role:
                        "superadmin",

                    isActive:
                        true
                });

            /*
            -------------------------------------------------
            Success
            -------------------------------------------------
            */

            console.log(
                "\n========================================"
            );

            console.log(
                "SPORTING ADMIN CREATED SUCCESSFULLY"
            );

            console.log(
                "========================================"
            );

            console.log(
                `Name: ${admin.name}`
            );

            console.log(
                `Email: ${admin.email}`
            );

            console.log(
                `Role: ${admin.role}`
            );

            console.log(
                "Status: Active"
            );

            console.log(
                "========================================\n"
            );

        } catch (error) {

            console.error(
                "\nAdmin seed failed:"
            );

            console.error(
                error.message
            );

            process.exitCode = 1;

        } finally {

            await mongoose.connection.close();

            console.log(
                "MongoDB connection closed."
            );
        }
    };

/*
=========================================================
 RUN
=========================================================
*/

const run =
    async () => {

        await connectDatabase();

        await seedAdmin();
    };

run();
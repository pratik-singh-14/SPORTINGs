/*
=========================================================
 SPORTING - BACKEND SERVER
 File: backend/server.js
=========================================================
*/

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes =
    require("./routes/authRoutes");

const applicationRoutes =
    require("./routes/applicationRoutes");

const eventRoutes =
    require("./routes/eventRoutes");

const participantRoutes =
    require("./routes/participantRoutes");

const contactRoutes =
    require("./routes/contactRoutes");

const {
    verifyEmailConnection
} = require("./utils/email");

/*
=========================================================
 EXPRESS APP
=========================================================
*/

const app =
    express();

/*
=========================================================
 ENVIRONMENT
=========================================================
*/

const PORT =
    process.env.PORT ||
    5000;

const NODE_ENV =
    process.env.NODE_ENV ||
    "development";

/*
=========================================================
 CORS CONFIGURATION
=========================================================
*/

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

const corsOptions = {

    origin:
        (origin, callback) => {

            /*
            -------------------------------------------------
            Allow requests without Origin.
            Useful for Postman/server-side requests.
            -------------------------------------------------
            */

            if (!origin) {
                return callback(
                    null,
                    true
                );
            }

            /*
            -------------------------------------------------
            Development mode
            -------------------------------------------------
            */

            if (
                NODE_ENV ===
                "development"
            ) {
                return callback(
                    null,
                    true
                );
            }

            /*
            -------------------------------------------------
            Production allowed origins
            -------------------------------------------------
            */

            if (
                allowedOrigins.includes(
                    origin
                )
            ) {
                return callback(
                    null,
                    true
                );
            }

            /*
            -------------------------------------------------
            Allow configured frontend URL
            -------------------------------------------------
            */

            const frontendURL =
                process.env.FRONTEND_URL;

            if (
                frontendURL &&
                origin ===
                    frontendURL
            ) {
                return callback(
                    null,
                    true
                );
            }

            /*
            -------------------------------------------------
            Reject unknown origin
            -------------------------------------------------
            */

            return callback(
                new Error(
                    "CORS policy: This origin is not allowed."
                )
            );
        },

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ],

    credentials:
        true
};

/*
=========================================================
 MIDDLEWARE
=========================================================
*/

app.use(
    cors(
        corsOptions
    )
);

/*
=========================================================
 BODY PARSERS
=========================================================
*/

app.use(
    express.json({
        limit:
            "2mb"
    })
);

app.use(
    express.urlencoded({
        extended:
            true,
        limit:
            "2mb"
    })
);

/*
=========================================================
 REQUEST LOGGER
=========================================================
*/

app.use(
    (req, res, next) => {

        const start =
            Date.now();

        res.on(
            "finish",
            () => {

                const duration =
                    Date.now() -
                    start;

                console.log(
                    `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
                );
            }
        );

        next();
    }
);

/*
=========================================================
 ROOT ROUTE
=========================================================
*/

app.get(
    "/",
    (req, res) => {

        res.status(200).json({

            success:
                true,

            message:
                "SPORTING API is running successfully.",

            company:
                "SPORTING",

            tagline:
                "Run. Play. Achieve.",

            environment:
                NODE_ENV,

            timestamp:
                new Date().toISOString()
        });
    }
);

/*
=========================================================
 API HEALTH CHECK
 GET /api/test
=========================================================
*/

app.get(
    "/api/test",
    (req, res) => {

        res.status(200).json({

            success:
                true,

            message:
                "SPORTING API is working.",

            server:
                "online",

            database:
                "connected",

            timestamp:
                new Date().toISOString()
        });
    }
);

/*
=========================================================
 API HEALTH / STATUS
 GET /api/health
=========================================================
*/

app.get(
    "/api/health",
    (req, res) => {

        const mongoose =
            require("mongoose");

        const dbState =
            mongoose.connection.readyState;

        let databaseStatus =
            "disconnected";

        if (
            dbState ===
            1
        ) {
            databaseStatus =
                "connected";
        }

        if (
            dbState ===
            2
        ) {
            databaseStatus =
                "connecting";
        }

        if (
            dbState ===
            3
        ) {
            databaseStatus =
                "disconnecting";
        }

        res.status(200).json({

            success:
                true,

            server:
                "online",

            database:
                databaseStatus,

            environment:
                NODE_ENV,

            uptime:
                process.uptime(),

            timestamp:
                new Date().toISOString()
        });
    }
);

/*
=========================================================
 API ROUTES
=========================================================
*/

/*
---------------------------------------------------------
 AUTH
 /api/auth
---------------------------------------------------------
*/

app.use(
    "/api/auth",
    authRoutes
);

/*
---------------------------------------------------------
 APPLICATIONS
 /api/applications
---------------------------------------------------------
*/

app.use(
    "/api/applications",
    applicationRoutes
);

/*
---------------------------------------------------------
 EVENTS
 /api/events
---------------------------------------------------------
*/

app.use(
    "/api/events",
    eventRoutes
);

/*
---------------------------------------------------------
 PARTICIPANTS
 /api/participants
---------------------------------------------------------
*/

app.use(
    "/api/participants",
    participantRoutes
);

/*
---------------------------------------------------------
 CONTACTS
 /api/contacts
---------------------------------------------------------
*/

app.use(
    "/api/contacts",
    contactRoutes
);

/*
=========================================================
 404 ROUTE
=========================================================
*/

app.use(
    (req, res) => {

        res.status(404).json({

            success:
                false,

            message:
                "API route not found.",

            path:
                req.originalUrl,

            method:
                req.method
        });
    }
);

/*
=========================================================
 GLOBAL ERROR HANDLER
=========================================================
*/

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Global server error:",
            error
        );

        /*
        -------------------------------------------------
        CORS error
        -------------------------------------------------
        */

        if (
            error.message &&
            error.message.includes(
                "CORS policy"
            )
        ) {
            return res.status(403).json({

                success:
                    false,

                message:
                    "Request blocked by CORS policy."
            });
        }

        /*
        -------------------------------------------------
        JSON parsing error
        -------------------------------------------------
        */

        if (
            error instanceof
            SyntaxError &&
            error.status ===
                400 &&
            "body" in error
        ) {
            return res.status(400).json({

                success:
                    false,

                message:
                    "Invalid JSON request body."
            });
        }

        /*
        -------------------------------------------------
        Payload too large
        -------------------------------------------------
        */

        if (
            error.type ===
            "entity.too.large"
        ) {
            return res.status(413).json({

                success:
                    false,

                message:
                    "Request payload is too large."
            });
        }

        /*
        -------------------------------------------------
        Default error
        -------------------------------------------------
        */

        return res.status(500).json({

            success:
                false,

            message:
                NODE_ENV ===
                    "development"
                    ? error.message
                    : "Internal server error."
        });
    }
);

/*
=========================================================
 START SERVER
=========================================================
*/

const startServer =
    async () => {

        try {

            /*
            -------------------------------------------------
            Validate important environment variables
            -------------------------------------------------
            */

            const requiredEnvironment =
                [
                    "MONGO_URI",
                    "JWT_SECRET"
                ];

            const missingEnvironment =
                requiredEnvironment.filter(
                    (key) =>
                        !process.env[
                            key
                        ]
                );

            if (
                missingEnvironment.length >
                0
            ) {

                console.error(
                    "\nMissing required environment variables:"
                );

                missingEnvironment.forEach(
                    (key) => {
                        console.error(
                            `- ${key}`
                        );
                    }
                );

                console.error(
                    "\nPlease add them to backend/.env before starting SPORTING.\n"
                );

                process.exit(1);
            }

            /*
            -------------------------------------------------
            Connect MongoDB
            -------------------------------------------------
            */

            await connectDB();

            /*
            -------------------------------------------------
            Start HTTP server
            -------------------------------------------------
            */

            const server =
                app.listen(
                    PORT,
                    () => {

                        console.log(
                            "\n========================================"
                        );

                        console.log(
                            "        SPORTING BACKEND SERVER"
                        );

                        console.log(
                            "========================================"
                        );

                        console.log(
                            `Environment: ${NODE_ENV}`
                        );

                        console.log(
                            `Server: http://localhost:${PORT}`
                        );

                        console.log(
                            `API: http://localhost:${PORT}/api`
                        );

                        console.log(
                            `Health: http://localhost:${PORT}/api/health`
                        );

                        console.log(
                            `Test: http://localhost:${PORT}/api/test`
                        );

                        console.log(
                            "Database: Connected"
                        );

                        console.log(
                            "========================================\n"
                        );
                    }
                );

            /*
            -------------------------------------------------
            Verify email service
            -------------------------------------------------
            */

            verifyEmailConnection()
                .then(
                    (result) => {

                        if (
                            result.success
                        ) {
                            console.log(
                                "Email service: Ready"
                            );
                        } else {
                            console.log(
                                "Email service: Not configured"
                            );
                        }
                    }
                )
                .catch(
                    (error) => {

                        console.error(
                            "Email service check failed:",
                            error.message
                        );
                    }
                );

            /*
            -------------------------------------------------
            Graceful shutdown - SIGINT
            -------------------------------------------------
            */

            process.on(
                "SIGINT",
                async () => {

                    console.log(
                        "\nSIGINT received. Shutting down..."
                    );

                    server.close(
                        async () => {

                            try {

                                const mongoose =
                                    require(
                                        "mongoose"
                                    );

                                await mongoose.connection.close();

                                console.log(
                                    "MongoDB connection closed."
                                );

                            } catch (
                                error
                            ) {

                                console.error(
                                    "MongoDB shutdown error:",
                                    error.message
                                );
                            }

                            console.log(
                                "SPORTING server stopped."
                            );

                            process.exit(
                                0
                            );
                        }
                    );
                }
            );

            /*
            -------------------------------------------------
            Graceful shutdown - SIGTERM
            -------------------------------------------------
            */

            process.on(
                "SIGTERM",
                async () => {

                    console.log(
                        "\nSIGTERM received. Shutting down..."
                    );

                    server.close(
                        async () => {

                            try {

                                const mongoose =
                                    require(
                                        "mongoose"
                                    );

                                await mongoose.connection.close();

                                console.log(
                                    "MongoDB connection closed."
                                );

                            } catch (
                                error
                            ) {

                                console.error(
                                    "MongoDB shutdown error:",
                                    error.message
                                );
                            }

                            console.log(
                                "SPORTING server stopped."
                            );

                            process.exit(
                                0
                            );
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                "\n========================================"
            );

            console.error(
                "SPORTING SERVER STARTUP FAILED"
            );

            console.error(
                "========================================"
            );

            console.error(
                error.message
            );

            console.error(
                "========================================\n"
            );

            process.exit(1);
        }
    };

/*
=========================================================
 START
=========================================================
*/

startServer();

/*
=========================================================
 EXPORT APP
 Useful for testing
=========================================================
*/

module.exports =
    app;
/*
=========================================================
 SPORTING - PARTICIPANT MODEL
 File: backend/models/Participant.js
=========================================================
*/

const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 150
        },

        event: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            default: null
        },

        sport: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        age: {
            type: Number,
            required: true,
            min: 5,
            max: 100
        },

        gender: {
            type: String,
            trim: true,
            enum: [
                "male",
                "female",
                "other",
                ""
            ],
            default: ""
        },

        emergencyContactName: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        emergencyPhone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20
        },

        address: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },

        city: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        state: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        category: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        registrationId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        status: {
            type: String,
            enum: [
                "registered",
                "confirmed",
                "cancelled",
                "completed"
            ],
            default: "registered"
        },

        paymentStatus: {
            type: String,
            enum: [
                "not_required",
                "pending",
                "paid",
                "failed",
                "refunded"
            ],
            default: "not_required"
        },

        paymentReference: {
            type: String,
            trim: true,
            default: ""
        },

        bibNumber: {
            type: String,
            trim: true,
            default: ""
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

/*
=========================================================
 INDEXES
=========================================================
*/

participantSchema.index({
    email: 1
});

participantSchema.index({
    phone: 1
});

participantSchema.index({
    eventId: 1
});

participantSchema.index({
    sport: 1
});

participantSchema.index({
    status: 1
});

participantSchema.index({
    createdAt: -1
});

/*
=========================================================
 AUTOMATIC REGISTRATION ID
=========================================================
*/

participantSchema.pre(
    "save",
    function (next) {

        if (!this.registrationId) {

            const randomPart =
                Math.random()
                    .toString(36)
                    .substring(
                        2,
                        7
                    )
                    .toUpperCase();

            const timePart =
                Date.now()
                    .toString()
                    .slice(-6);

            this.registrationId =
                `SPT-${timePart}-${randomPart}`;
        }

        next();
    }
);

/*
=========================================================
 EXPORT MODEL
=========================================================
*/

module.exports =
    mongoose.model(
        "Participant",
        participantSchema
    );
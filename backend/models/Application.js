/*
=========================================================
 SPORTING - EVENT APPLICATION MODEL
 File: backend/models/Application.js
=========================================================
*/

const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
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

        competitionName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        sport: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        eventDate: {
            type: Date,
            required: true
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 250
        },

        expectedParticipants: {
            type: Number,
            required: true,
            min: 1
        },

        eventType: {
            type: String,
            required: true,
            trim: true,
            enum: [
                "Organizing a Marathon",
                "Organizing any Sports Competition",
                "Hiring SPORTING for Complete Event Management"
            ]
        },

        requiredFacilities: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        budget: {
            type: String,
            trim: true,
            maxlength: 100,
            default: ""
        },

        message: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "pending",
                "reviewing",
                "approved",
                "rejected",
                "completed"
            ],
            default: "pending"
        },

        adminNotes: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: ""
        },

        reviewedAt: {
            type: Date,
            default: null
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

applicationSchema.index({
    email: 1
});

applicationSchema.index({
    status: 1
});

applicationSchema.index({
    eventDate: 1
});

applicationSchema.index({
    createdAt: -1
});

/*
=========================================================
 EXPORT MODEL
=========================================================
*/

module.exports =
    mongoose.model(
        "Application",
        applicationSchema
    );
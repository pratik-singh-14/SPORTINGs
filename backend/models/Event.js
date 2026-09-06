/*
=========================================================
 SPORTING - EVENT MODEL
 File: backend/models/Event.js
=========================================================
*/

const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 200
        },

        description: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: ""
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

        endDate: {
            type: Date,
            default: null
        },

        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 250
        },

        venue: {
            type: String,
            trim: true,
            maxlength: 250,
            default: ""
        },

        expectedParticipants: {
            type: Number,
            default: 0,
            min: 0
        },

        maxParticipants: {
            type: Number,
            default: 0,
            min: 0
        },

        registrationFee: {
            type: Number,
            default: 0,
            min: 0
        },

        image: {
            type: String,
            trim: true,
            default: ""
        },

        organizer: {
            type: String,
            trim: true,
            default: "SPORTING"
        },

        contactEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: "singhpratik0143@gmail.com"
        },

        contactPhone: {
            type: String,
            trim: true,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "upcoming",
                "ongoing",
                "completed",
                "cancelled"
            ],
            default: "upcoming"
        },

        registrationOpen: {
            type: Boolean,
            default: true
        },

        registrationDeadline: {
            type: Date,
            default: null
        },

        featured: {
            type: Boolean,
            default: false
        },

        rules: {
            type: [String],
            default: []
        },

        facilities: {
            type: [String],
            default: []
        },

        prizes: {
            type: [String],
            default: []
        },

        gallery: {
            type: [String],
            default: []
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

eventSchema.index({
    eventDate: 1
});

eventSchema.index({
    sport: 1
});

eventSchema.index({
    status: 1
});

eventSchema.index({
    featured: 1
});

eventSchema.index({
    createdAt: -1
});

/*
=========================================================
 AUTOMATIC EVENT STATUS
=========================================================
*/

eventSchema.pre(
    "save",
    function (next) {

        if (
            this.status === "cancelled"
        ) {
            return next();
        }

        const now =
            new Date();

        const start =
            this.eventDate;

        const end =
            this.endDate ||
            this.eventDate;

        if (now < start) {
            this.status =
                "upcoming";
        } else if (
            now >= start &&
            now <= end
        ) {
            this.status =
                "ongoing";
        } else if (
            now > end
        ) {
            this.status =
                "completed";
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
        "Event",
        eventSchema
    );
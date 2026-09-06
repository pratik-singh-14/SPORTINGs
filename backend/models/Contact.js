/*
=========================================================
 SPORTING - CONTACT MODEL
 File: backend/models/Contact.js
=========================================================
*/

const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 150
        },

        phone: {
            type: String,
            trim: true,
            maxlength: 20,
            default: ""
        },

        company: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ""
        },

        subject: {
            type: String,
            trim: true,
            maxlength: 250,
            default: ""
        },

        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 5,
            maxlength: 3000
        },

        status: {
            type: String,
            enum: [
                "new",
                "read",
                "replied",
                "closed"
            ],
            default: "new"
        },

        adminNotes: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: ""
        },

        repliedAt: {
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

contactSchema.index({
    email: 1
});

contactSchema.index({
    status: 1
});

contactSchema.index({
    createdAt: -1
});

/*
=========================================================
 EXPORT MODEL
=========================================================
*/

module.exports =
    mongoose.model(
        "Contact",
        contactSchema
    );
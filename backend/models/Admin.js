/*
=========================================================
 SPORTING - ADMIN MODEL
 File: backend/models/Admin.js
=========================================================
*/

const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
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
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 150
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        role: {
            type: String,
            default: "admin",
            enum: [
                "admin",
                "superadmin"
            ]
        },

        isActive: {
            type: Boolean,
            default: true
        },

        lastLogin: {
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
 REMOVE PASSWORD FROM JSON RESPONSES
=========================================================
*/

adminSchema.methods.toJSON = function () {
    const admin =
        this.toObject();

    delete admin.password;

    return admin;
};

/*
=========================================================
 EXPORT MODEL
=========================================================
*/

module.exports =
    mongoose.model(
        "Admin",
        adminSchema
    );
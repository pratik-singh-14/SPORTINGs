require("dotenv").config();

const mongoose = require("mongoose");
const Event = require("../models/Event");

const MONGO_URI = process.env.MONGO_URI;

const events = [
    {
        title: "SPORTING City Marathon 2026",
        sport: "Marathon",
        eventDate: new Date("2026-10-25T06:00:00+05:30"),
        location: "Varanasi, Uttar Pradesh",
        description:
            "A professional marathon event organized by SPORTING.",
        maxParticipants: 1000,
        registrationOpen: true,
        registrationDeadline:
            new Date("2026-10-20T23:59:59+05:30"),
        status: "upcoming"
    },
    {
        title: "SPORTING Cricket Championship 2026",
        sport: "Cricket",
        eventDate: new Date("2026-11-15T08:00:00+05:30"),
        location: "Ghazipur, Uttar Pradesh",
        description:
            "An exciting cricket championship organized by SPORTING.",
        maxParticipants: 500,
        registrationOpen: true,
        registrationDeadline:
            new Date("2026-11-10T23:59:59+05:30"),
        status: "upcoming"
    }
];

async function addEvents() {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        await mongoose.connect(MONGO_URI);

        console.log("MongoDB connected successfully.");
        console.log("");

        for (const event of events) {
            const existingEvent = await Event.findOne({
                title: event.title
            });

            if (existingEvent) {
                console.log("Event already exists:");
                console.log("Title:", existingEvent.title);
                console.log(
                    "Event ID:",
                    existingEvent._id.toString()
                );
                console.log("");
                continue;
            }

            const newEvent = await Event.create(event);

            console.log("======================================");
            console.log("EVENT CREATED SUCCESSFULLY");
            console.log("======================================");
            console.log("Title:", newEvent.title);
            console.log("Sport:", newEvent.sport);
            console.log("Date:", newEvent.eventDate);
            console.log("Location:", newEvent.location);
            console.log("Status:", newEvent.status);
            console.log(
                "Registration Open:",
                newEvent.registrationOpen
            );
            console.log(
                "MongoDB Event ID:",
                newEvent._id.toString()
            );
            console.log("======================================");
            console.log("");
        }

        await mongoose.disconnect();

        console.log("MongoDB disconnected.");
        console.log("All events processed successfully.");

    } catch (error) {
        console.error("");
        console.error("Failed to create events.");
        console.error(error.message);

        try {
            await mongoose.disconnect();
        } catch (disconnectError) {}

        process.exit(1);
    }
}

addEvents();
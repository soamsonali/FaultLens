
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createWarden() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

       const email = process.env.WARDEN_EMAIL;
const password = process.env.WARDEN_PASSWORD;

if (!email || !password) {
    throw new Error("Set WARDEN_EMAIL and WARDEN_PASSWORD in .env");
}

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log("Warden account already exists!");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const warden = new User({
            name: "FaultLens Warden",
            email: email,
            password: hashedPassword,
            role: "Warden"
        });

        await warden.save();

        console.log("Warden account created successfully!");
        console.log("Email:", email);
        console.log("Password:", password);

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

createWarden();


require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Issue = require("./models/Issue");
const User = require("./models/User");

const app = express();

const PORT = 7000;

// Middleware
app.use(express.json());
app.use(cors());
// ===============================
// AUTHENTICATION MIDDLEWARE
// ===============================

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access denied. Please login."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please login again."
        });
    }
};

// Check user role
const allowRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You are not authorized to perform this action."
            });
        }

        next();
    };
};

// GET ALL COMPLAINTS (WARDEN)
app.get(
    "/api/issues",
    verifyToken,
    allowRoles("Warden"),
    async (req, res) => {
        try {
            const issues = await Issue.find()
                .populate("student", "name email")
                .sort({ createdAt: -1 });

            res.json({
                count: issues.length,
                data: issues
            });

        } catch (error) {
            res.status(500).json({
                message: "Could not fetch complaints",
                error: error.message
            });
        }
    }
);

// HOME ROUTE
app.get("/", (req, res) => {
    res.send("Welcome to FaultLens!");
});

// HEALTH CHECK
app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "FaultLens backend is working!"
    });
});

// ===============================
// STUDENT REGISTRATION
// ===============================

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password, block, room } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (typeof password !== "string" || password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "Student",
            block,
            room
        });

        await newUser.save();

        res.status(201).json({
            message: "Student registered successfully!",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
});

// ===============================
// USER LOGIN
// ===============================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

// ===============================
// GET ISSUE BY ID
// ===============================


// ===============================
// UPDATE COMPLAINT STATUS
// ===============================


 // ===============================
 // UPDATE COMPLAINT STATUS (WARDEN)
 // ===============================

app.patch(
    "/api/issues/:id/status",
    verifyToken,
    allowRoles("Warden"),
    async (req, res) => {
        try {
            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "Assigned",
                "In Progress",
                "Resolved"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid status"
                });
            }

            const updatedIssue = await Issue.findByIdAndUpdate(
                req.params.id,
                { status },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (!updatedIssue) {
                return res.status(404).json({
                    message: "Complaint not found"
                });
            }

            res.json({
                message: "Status updated successfully!",
                data: updatedIssue
            });

        } catch (error) {
            res.status(500).json({
                message: "Could not update status",
                error: error.message
            });
        }
    }
);

// STUDENT REPAIR CONFIRMATION
app.patch(
    "/api/issues/:id/confirmation",
    verifyToken,
    allowRoles("Student"),
    async (req, res) => {
        try {
            const { confirmation } = req.body;

            if (!["Confirmed", "Unresolved"].includes(confirmation)) {
                return res.status(400).json({
                    message: "Invalid confirmation"
                });
            }

            const issue = await Issue.findOne({
                _id: req.params.id,
                student: req.user.id
            });

            if (!issue) {
                return res.status(404).json({
                    message: "Complaint not found"
                });
            }

            if (issue.status !== "Resolved") {
                return res.status(400).json({
                    message: "Complaint is not marked as resolved yet"
                });
            }

            issue.studentConfirmation = confirmation;

            if (confirmation === "Unresolved") {
                issue.status = "In Progress";
            }

            await issue.save();

            res.json({
                message: "Repair confirmation submitted successfully",
                data: issue
            });

        } catch (error) {
            res.status(500).json({
                message: "Could not submit confirmation",
                error: error.message
            });
        }
    }
);

// ===============================
// GET MY COMPLAINTS (STUDENT)
// ===============================

app.get(
    "/api/issues/mine",
    verifyToken,
    allowRoles("Student"),
    async (req, res) => {
        try {
            const issues = await Issue.find({
                student: req.user.id
            }).sort({ createdAt: -1 });

            res.json({
                count: issues.length,
                data: issues
            });

        } catch (error) {
            res.status(500).json({
                message: "Could not fetch your complaints",
                error: error.message
            });
        }
    }
);

// ===============================
// SUBMIT COMPLAINT (STUDENT)
// ===============================

app.post(
    "/api/issues",
    verifyToken,
    allowRoles("Student"),
    async (req, res) => {
        try {
            const {
                title,
                description,
                category,
                severity,
                block,
                room
            } = req.body;

            const newIssue = new Issue({
                title,
                description,
                category,
                severity,
                block,
                room,
                student: req.user.id
            });

            const savedIssue = await newIssue.save();

            res.status(201).json({
                message: "Complaint saved successfully!",
                data: savedIssue
            });

        } catch (error) {
            res.status(400).json({
                message: "Could not save complaint",
                error: error.message
            });
        }
    }
);


// ===============================
// FILTER COMPLAINTS
// ===============================

app.get("/api/filter-issues", (req, res) => {
    const status = req.query.status;

    res.send("Showing issues with status: " + status);
});

// ===============================
// CONNECT DATABASE AND START SERVER
// ===============================

async function startServer() {
    try {
        if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
            throw new Error("MONGODB_URI or JWT_SECRET is missing from .env");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`FaultLens server running on port ${PORT}`);
        });

    } catch (error) {
        console.log("Server startup error:", error.message);
    }
}

startServer();

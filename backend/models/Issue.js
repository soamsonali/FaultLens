
const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ["Low", "Medium", "High", "Critical"],
        default: "Medium"
    },
    block: {
        type: String,
        required: true
    },
    room: {
        type: String,
        required: true
    },

    // Student who submitted this complaint
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    status: {
    type: String,
    default: "Pending"
},

studentConfirmation: {
    type: String,
    enum: ["Pending", "Confirmed", "Unresolved"],
    default: "Pending"
}
}, {
    timestamps: true
});

module.exports = mongoose.model("Issue", issueSchema);

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// ─── Schema ──────────────────────────────────────────────────────────────────
const MessageSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Booking",
        required: [true, "bookingId is required"],
        index: true,
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "senderId is required"],
        index: true,
    },
    senderRole: {
        type: String,
        enum: {
            values: ["client", "provider"],
            message: "senderRole must be 'client' or 'provider'",
        },
        required: [true, "senderRole is required"],
    },
    text: {
        type: String,
        required: [true, "Message text is required"],
        trim: true,
        maxlength: [4000, "Message text must be at most 4000 characters"],
    },
    contentType: {
        type: String,
        enum: {
            values: ["text", "image", "system"],
            message: "contentType must be 'text', 'image', or 'system'",
        },
        default: "text",
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// ─── Indexes ──────────────────────────────────────────────────────────────────
// Fetch all messages for a booking, newest first
MessageSchema.index({ bookingId: 1, createdAt: -1 });
// Count unread messages for a sender
MessageSchema.index({ senderId: 1, isRead: 1 });
// ─── Model Export ─────────────────────────────────────────────────────────────
const Message = (0, mongoose_1.model)("Message", MessageSchema);
exports.default = Message;
//# sourceMappingURL=Message.model.js.map
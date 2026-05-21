import { Schema, model, Document, Types } from "mongoose";

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export type SenderRole = "client" | "provider";
export type MessageContentType = "text" | "image" | "system";

export interface IMessage {
  bookingId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: SenderRole;
  text: string;
  contentType: MessageContentType;
  isRead: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMessageDocument extends IMessage, Document {
  _id: Types.ObjectId;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const MessageSchema = new Schema<IMessageDocument>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "bookingId is required"],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "senderId is required"],
      index: true,
    },
    senderRole: {
      type: String,
      enum: {
        values: ["client", "provider"] as SenderRole[],
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
        values: ["text", "image", "system"] as MessageContentType[],
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Fetch all messages for a booking, newest first
MessageSchema.index({ bookingId: 1, createdAt: -1 });

// Count unread messages for a sender
MessageSchema.index({ senderId: 1, isRead: 1 });

// ─── Model Export ─────────────────────────────────────────────────────────────

const Message = model<IMessageDocument>("Message", MessageSchema);
export default Message;

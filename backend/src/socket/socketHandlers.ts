import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import Provider from "../models/Provider.model";
import Message from "../models/Message.model";

// ─── io Singleton ─────────────────────────────────────────────────────────────

/**
 * Module-level io instance.
 * Set once by initializeSocket() — exported via getIo() for use in the Orchestrator.
 */
let _io: SocketServer | null = null;

/**
 * Returns the live Socket.io server instance.
 * Throws if called before initializeSocket().
 */
export const getIo = (): SocketServer => {
  if (!_io) throw new Error("Socket.io not initialized — call initializeSocket() first");
  return _io;
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PresencePayload {
  providerId: string;
  latitude?: number;
  longitude?: number;
  serviceCategory?: string;
  city?: string;
  area?: string;
}

interface MessagePayload {
  bookingId: string;
  senderId: string;
  senderRole: "client" | "provider";
  text: string;
}

// ─── Initialization ───────────────────────────────────────────────────────────

export const initializeSocket = (httpServer: HttpServer): SocketServer => {
  _io = new SocketServer(httpServer, {
    cors: {
      origin: (process.env["CORS_ORIGIN"] ?? "").split(","),
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  _io.on("connection", (socket: Socket) => {
    console.log(`🔌  Socket connected: ${socket.id}`);

    // ── provider:online ──────────────────────────────────────────────────────
    socket.on("provider:online", async (payload: PresencePayload) => {
      const { providerId, latitude, longitude, serviceCategory, city, area } = payload;

      if (!providerId) {
        socket.emit("error", { message: "provider:online requires providerId" });
        return;
      }

      try {
        const updateData: Record<string, unknown> = {
          isActive: true,
          lastSeenAt: new Date(),
          socketId: socket.id,
        };

        if (typeof latitude === "number" && typeof longitude === "number") {
          updateData["location"] = { type: "Point", coordinates: [longitude, latitude] };
        }
        if (serviceCategory) updateData["serviceCategory"] = serviceCategory;

        await Provider.findByIdAndUpdate(providerId, updateData, { runValidators: true });

        // Join personal room, city room, and area room
        void socket.join(`provider:${providerId}`);
        if (city) {
          void socket.join(`city:${city}`);
          if (area) {
            void socket.join(`area:${city}:${area}`);
          }
        }

        // Store metadata on socket for auto-cleanup
        socket.data.providerId = providerId;
        socket.data.city = city;
        socket.data.area = area;

        console.log(`🟢  Provider Online: ${providerId} in ${city}/${area || "Unknown"}`);
        socket.emit("provider:status_ack", { isActive: true, socketId: socket.id });
      } catch (err) {
        console.error(`❌  provider:online error:`, err);
        socket.emit("error", { message: "Failed to set status to online" });
      }
    });

    // ── provider:offline ─────────────────────────────────────────────────────
    socket.on("provider:offline", async (payload: { providerId: string }) => {
      try {
        const providerId = payload?.providerId || socket.data?.providerId;
        if (!providerId) return;

        await Provider.findByIdAndUpdate(providerId, {
          isActive: false,
          lastSeenAt: new Date(),
          socketId: undefined,
        });

        // Thorough room cleanup
        const rooms = Array.from(socket.rooms);
        rooms.forEach((room) => {
          if (room.startsWith("provider:") || room.startsWith("city:") || room.startsWith("area:")) {
            void socket.leave(room);
          }
        });

        console.log(`🔴  Provider Offline: ${providerId}`);
        socket.emit("provider:status_ack", { isActive: false });
      } catch (err) {
        console.error(`❌  provider:offline error:`, err);
      }
    });

    // ── message:send ─────────────────────────────────────────────────────────
    // Payload: { bookingId, senderId, senderRole, text }
    socket.on("message:send", async (payload: MessagePayload) => {
      const { bookingId, senderId, senderRole, text } = payload;

      if (!bookingId || !senderId || !text) {
        socket.emit("error", { message: "message:send requires bookingId, senderId, text" });
        return;
      }

      try {
        const message = await Message.create({
          bookingId,
          senderId,
          senderRole: senderRole || "client",
          text,
        });

        // Safe broadcast
        try {
          _io?.to(`booking:${bookingId}`).emit("message:new", {
            bookingId,
            senderId,
            senderRole,
            text,
            timestamp: message.createdAt,
            messageId: message._id,
          });
        } catch (emitErr) {
          console.warn(`⚠️  Message emit failed for booking ${bookingId}`);
        }

        console.log(`💬  Message in booking ${bookingId} from ${senderRole}`);
      } catch (err) {
        console.error(`❌  message:send error:`, err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── disconnect ───────────────────────────────────────────────────────────
    socket.on("disconnect", async (reason: string) => {
      console.log(`🔌  Socket disconnected: ${socket.id} — ${reason}`);

      // Safe access to metadata
      const providerId = socket.data?.providerId;
      if (!providerId) return;

      try {
        await Provider.findByIdAndUpdate(providerId, {
          isActive: false,
          lastSeenAt: new Date(),
          socketId: undefined,
        });
        console.log(`🔴  Provider auto-offline on disconnect: ${providerId}`);
      } catch (err) {
        console.error(`❌  disconnect cleanup error:`, err);
      }
    });
  });

  return _io;
};

import { io, Socket } from "socket.io-client";

/**
 * Mahir Socket Service
 * Handles low-level socket.io-client initialization and lifecycle.
 * Strictly uses EXPO_PUBLIC_SOCKET_URL from environment.
 */

const SOCKET_URL = process.env["EXPO_PUBLIC_SOCKET_URL"] || "http://localhost:3000";

class SocketService {
  private socket: Socket | null = null;

  /** Initialize and return the socket instance */
  public connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log(`🔌 [SocketService] Connected to ${SOCKET_URL} | ID: ${this.socket?.id}`);
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`🔌 [SocketService] Disconnected | Reason: ${reason}`);
    });

    this.socket.on("connect_error", (err) => {
      console.warn(`🔌 [SocketService] Connection Error: ${err.message}`);
    });

    return this.socket;
  }

  /** Disconnect the socket */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /** Return current socket instance if connected */
  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();

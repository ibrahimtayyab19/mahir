import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
/**
 * Returns the live Socket.io server instance.
 * Throws if called before initializeSocket().
 */
export declare const getIo: () => SocketServer;
export declare const initializeSocket: (httpServer: HttpServer) => SocketServer;
//# sourceMappingURL=socketHandlers.d.ts.map
/**
 * Establishes the Mongoose connection to MongoDB.
 * Retries are handled by Mongoose's internal reconnect logic.
 * Call this once during server boot — never await it inline.
 */
export declare const connectDB: () => Promise<void>;
//# sourceMappingURL=db.d.ts.map
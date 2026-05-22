import { Document, Types } from "mongoose";
/**
 * Strict booking status lifecycle from Master Architecture §5D.
 * Transitions:  pending → confirmed → en-route → in-progress → completed
 *               any → cancelled
 *               completed → disputed
 */
export type BookingStatus = "pending" | "confirmed" | "en-route" | "in-progress" | "completed" | "cancelled" | "disputed";
export interface BookingPricing {
    baseFee: number;
    distanceCharge: number;
    urgencySurge: number;
    peakHourCharge: number;
    totalEstimate: number;
    currency: "PKR";
}
export interface IBooking {
    jobPostId: Types.ObjectId;
    clientId: Types.ObjectId;
    providerId: Types.ObjectId;
    serviceType: string;
    status: BookingStatus;
    statusHistory: Array<{
        status: string;
        timestamp: Date;
        note?: string;
    }>;
    scheduledTime: Date;
    startedAt?: Date;
    completedAt?: Date;
    pricing: BookingPricing;
    completionPhotos: string[];
    clientRating?: number;
    providerRating?: number;
    agentSessionId: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IBookingDocument extends IBooking, Document {
    _id: Types.ObjectId;
}
declare const Booking: import("mongoose").Model<IBookingDocument, {}, {}, {}, Document<unknown, {}, IBookingDocument, {}, {}> & IBookingDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Booking;
//# sourceMappingURL=Booking.model.d.ts.map
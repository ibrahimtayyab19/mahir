import { Document, Types } from "mongoose";
interface GeoJSONPoint {
    type: "Point";
    coordinates: [number, number];
}
export interface IProvider {
    userId: Types.ObjectId;
    skills: string[];
    bio?: string;
    serviceCategory: string;
    location: GeoJSONPoint;
    isActive: boolean;
    lastSeenAt?: Date;
    socketId?: string;
    rating: number;
    totalReviews: number;
    onTimeScore: number;
    completionRate: number;
    responseTimeMinutes: number;
    cancellationRate: number;
    reviewSentiment: number;
    totalJobsCompleted: number;
    totalEarningsPKR: number;
    walletBalance: number;
    pricePerHour: number;
    cnicVerified: boolean;
    backgroundCheckPassed: boolean;
    verifiedBadge: boolean;
    portfolioPhotos: string[];
    experienceYears: number;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IProviderDocument extends IProvider, Document {
    _id: Types.ObjectId;
}
declare const Provider: import("mongoose").Model<IProviderDocument, {}, {}, {}, Document<unknown, {}, IProviderDocument, {}, {}> & IProviderDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Provider;
//# sourceMappingURL=Provider.model.d.ts.map
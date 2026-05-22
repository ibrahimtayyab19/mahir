import { Document, Types } from "mongoose";
export type JobStatus = "open" | "matched" | "accepted" | "in_progress" | "completed" | "cancelled" | "expired";
export type UrgencyLevel = "low" | "medium" | "high";
interface GeoJSONPoint {
    type: "Point";
    coordinates: [number, number];
}
export interface IJobPost {
    clientId: Types.ObjectId;
    title: string;
    category: string;
    serviceType: string;
    rawInput?: string;
    descriptionEN?: string;
    descriptionUR?: string;
    descriptionRU?: string;
    aiSummary?: string;
    aiGeneratedAt?: Date;
    urgency: UrgencyLevel;
    preferredTime?: string;
    description: string;
    location: GeoJSONPoint;
    address: string;
    area?: string;
    city: string;
    budgetMinPKR: number;
    budgetMaxPKR: number;
    agreedPricePKR?: number;
    budgetRange?: {
        min: number;
        max: number;
    };
    status: JobStatus;
    assignedProviderId?: Types.ObjectId;
    matchedProviderIds?: Types.ObjectId[];
    expiresAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IJobPostDocument extends IJobPost, Document {
    _id: Types.ObjectId;
}
declare const JobPost: import("mongoose").Model<IJobPostDocument, {}, {}, {}, Document<unknown, {}, IJobPostDocument, {}, {}> & IJobPostDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default JobPost;
//# sourceMappingURL=JobPost.model.d.ts.map
import { Document, Types } from "mongoose";
export type UserRole = "client" | "provider";
/**
 * GeoJSON Point sub-document for 2dsphere indexing.
 * Used for proximity-based job matching.
 */
interface GeoJSONPoint {
    type: "Point";
    coordinates: [number, number];
}
export interface IUser {
    name: string;
    email: string;
    passwordHash: string;
    phone?: string;
    role: UserRole;
    location?: GeoJSONPoint;
    city?: string;
    area?: string;
    avatarUrl?: string;
    isVerified: boolean;
    isActive: boolean;
    refreshToken?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface IUserDocument extends IUser, Document {
    _id: Types.ObjectId;
}
declare const User: import("mongoose").Model<IUserDocument, {}, {}, {}, Document<unknown, {}, IUserDocument, {}, {}> & IUserDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default User;
//# sourceMappingURL=User.model.d.ts.map
import { Document, Types } from "mongoose";
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
declare const Message: import("mongoose").Model<IMessageDocument, {}, {}, {}, Document<unknown, {}, IMessageDocument, {}, {}> & IMessageDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Message;
//# sourceMappingURL=Message.model.d.ts.map
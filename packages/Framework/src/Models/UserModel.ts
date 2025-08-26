import mongoose, { Document, Schema, Types, Model } from 'mongoose';

/******************************************************************************************************************
 * Interfaces
 ******************************************************************************************************************/
export interface IRefreshToken {
  tokenHash: string;      // hashed version of the refresh token (never stored in plaintext)
  createdAt: Date;        // when this refresh token was first issued
  lastUsedAt: Date;       // timestamp of last successful token usage (e.g. access token refresh)
  expiresAt: Date;        // expiry timestamp for this refresh session
  userAgent?: string;     // browser or device info (for session listing)
  ip?: string;            // IP address at token creation
}

export interface IUser extends Document {
  // MongoDB auto --------------------------------------------/
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // ours ----------------------------------------------------/
  email: string;                  // user’s unique email (used for login)
  passwordHash: string;           // securely hashed password using bcrypt
  refreshTokens: IRefreshToken[]; // list of active refresh token sessions
}

/******************************************************************************************************************
 * Mongoose schemas
 ******************************************************************************************************************/
const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: String,
    createdAt: Date,
    lastUsedAt: Date,
    expiresAt: Date,
    userAgent: String,
    ip: String,
  },
  { _id: false } // disables auto _id on subdocs
);

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
  },
  { timestamps: true }
);

/******************************************************************************************************************
 * Indexes
 ******************************************************************************************************************/
// index on email already set: "unique: true" enforces a unique index on the email field
UserSchema.index({ 'refreshTokens.tokenHash': 1 });   // enables fast refresh token validation

/******************************************************************************************************************
 * Mongoose Model
 ******************************************************************************************************************/
export const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

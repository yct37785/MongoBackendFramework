import mongoose from 'mongoose';

/******************************************************************************************************************
 * Interfaces
 ******************************************************************************************************************/
export interface IEntry extends Document {
  // MongoDB auto --------------------------------------------/
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // ours ----------------------------------------------------/
  userId: mongoose.Types.ObjectId;   // reference to the owning user (FK to User)
  title: string;                     // entry title
  content: string;                   // entry content
}

/******************************************************************************************************************
 * Mongoose schema
 ******************************************************************************************************************/
const EntrySchema = new mongoose.Schema<IEntry>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

/******************************************************************************************************************
 * Indexes
 ******************************************************************************************************************/
EntrySchema.index({ userId: 1 });                         // for user-wide access
EntrySchema.index({ userId: 1, _id: 1 });                 // for secure ownership validation
EntrySchema.index({ userId: 1, updatedAt: -1 });          // for dashboard-style recent listing

/******************************************************************************************************************
 * Mongoose Model
 ******************************************************************************************************************/
export const EntryModel: mongoose.Model<IEntry> = mongoose.model<IEntry>('Entries', EntrySchema);

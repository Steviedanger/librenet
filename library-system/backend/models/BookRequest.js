import mongoose from 'mongoose';

const bookRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true, default: '' },
    genre: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    reason: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'added'],
      default: 'pending',
      index: true,
    },
    adminNote: { type: String, trim: true, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const BookRequest = mongoose.model('BookRequest', bookRequestSchema);
export default BookRequest;
import mongoose from 'mongoose';

const borrowRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    borrowedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue'],
      default: 'active',
    },
    // Fine tracking (amounts in GHS). fineAmount is recalculated while a book
    // is overdue and frozen once the book is returned.
    fineAmount: { type: Number, default: 0 },
    finePaid: { type: Boolean, default: false },
    finePaidAt: { type: Date, default: null },
    finePaidBy: { type: String, default: '' },
  },
  { timestamps: true }
);

/**
 * Virtual flag indicating whether an active record is past its due date.
 * Computed rather than stored so it is always accurate when read.
 */
borrowRecordSchema.virtual('isOverdue').get(function () {
  return this.status === 'active' && this.dueDate < new Date();
});

borrowRecordSchema.set('toJSON', { virtuals: true });
borrowRecordSchema.set('toObject', { virtuals: true });

const BorrowRecord = mongoose.model('BorrowRecord', borrowRecordSchema);
export default BorrowRecord;

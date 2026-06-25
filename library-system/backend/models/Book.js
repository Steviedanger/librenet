import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    author: { type: String, required: true, trim: true, index: true },
    genre: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    coverPublicId: { type: String, default: '' },
    pdfFile: { type: String, default: '' },
    pdfPublicId: { type: String, default: '' },
    publishedYear: { type: Number, required: true },
    totalCopies: { type: Number, default: 1, min: 0 },
    availableCopies: { type: Number, default: 1, min: 0 },
    totalBorrows: { type: Number, default: 0 },
    pageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index to support search across title, author and genre
bookSchema.index({ title: 'text', author: 'text', genre: 'text' });

const Book = mongoose.model('Book', bookSchema);
export default Book;

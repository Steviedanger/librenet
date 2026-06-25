import Book from '../models/Book.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { saveUpload, removeUpload } from '../utils/fileStorage.js';

const SORT_MAP = {
  newest: { createdAt: -1 },
  popular: { totalBorrows: -1 },
  title: { title: 1 },
  year: { publishedYear: -1 },
};

/**
 * GET /api/books
 * Supports search (q), genre/year/availability filters, sort and pagination.
 */
export const getBooks = async (req, res, next) => {
  try {
    const {
      q = '',
      genre = '',
      year = '',
      availability = '',
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {};

    if (q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter.$or = [{ title: regex }, { author: regex }, { genre: regex }];
    }
    if (genre) filter.genre = genre;
    if (year) filter.publishedYear = Number(year);
    if (availability === 'available') filter.availableCopies = { $gt: 0 };
    if (availability === 'unavailable') filter.availableCopies = { $lte: 0 };

    const pageNum = Math.max(1, Number(page));
    const perPage = Math.max(1, Math.min(50, Number(limit)));
    const sortBy = SORT_MAP[sort] || SORT_MAP.newest;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .sort(sortBy)
        .skip((pageNum - 1) * perPage)
        .limit(perPage),
      Book.countDocuments(filter),
    ]);

    res.json({
      books,
      page: pageNum,
      totalPages: Math.ceil(total / perPage) || 1,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/genres — distinct genre list for filters.
 */
export const getGenres = async (req, res, next) => {
  try {
    const genres = await Book.distinct('genre');
    res.json({ genres: genres.sort() });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/:id
 */
export const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ book });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/books (admin) — create a book with optional cover + PDF uploads.
 */
export const createBook = async (req, res, next) => {
  try {
    const {
      title,
      author,
      genre,
      description = '',
      publishedYear,
      totalCopies = 1,
      pageCount = 0,
    } = req.body;

    if (!title || !author || !genre || !publishedYear) {
      return res.status(400).json({
        message: 'Title, author, genre and published year are required',
      });
    }

    let cover = { url: '', publicId: '' };
    let pdf = { url: '', publicId: '' };
    if (req.files?.coverImage?.[0]) {
      cover = await saveUpload(req.files.coverImage[0], 'cover');
    }
    if (req.files?.pdfFile?.[0]) {
      pdf = await saveUpload(req.files.pdfFile[0], 'pdf');
    }

    const copies = Number(totalCopies) || 1;

    const book = await Book.create({
      title,
      author,
      genre,
      description,
      publishedYear: Number(publishedYear),
      totalCopies: copies,
      availableCopies: copies,
      pageCount: Number(pageCount) || 0,
      coverImage: cover.url,
      coverPublicId: cover.publicId,
      pdfFile: pdf.url,
      pdfPublicId: pdf.publicId,
    });

    res.status(201).json({ book });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/books/:id (admin)
 */
export const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const fields = [
      'title',
      'author',
      'genre',
      'description',
      'publishedYear',
      'pageCount',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) book[f] = req.body[f];
    });

    // Adjust available copies in step with any change to total copies
    if (req.body.totalCopies !== undefined) {
      const newTotal = Number(req.body.totalCopies);
      const borrowed = book.totalCopies - book.availableCopies;
      book.totalCopies = newTotal;
      book.availableCopies = Math.max(0, newTotal - borrowed);
    }

    if (req.files?.coverImage?.[0]) {
      await removeUpload(book.coverPublicId);
      const cover = await saveUpload(req.files.coverImage[0], 'cover');
      book.coverImage = cover.url;
      book.coverPublicId = cover.publicId;
    }
    if (req.files?.pdfFile?.[0]) {
      await removeUpload(book.pdfPublicId);
      const pdf = await saveUpload(req.files.pdfFile[0], 'pdf');
      book.pdfFile = pdf.url;
      book.pdfPublicId = pdf.publicId;
    }

    await book.save();
    res.json({ book });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/books/:id (admin)
 */
export const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await removeUpload(book.coverPublicId);
    await removeUpload(book.pdfPublicId);

    await book.deleteOne();
    await BorrowRecord.deleteMany({ book: book._id });

    res.json({ message: 'Book deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/:id/read (auth) — return the PDF URL for the in-app reader.
 */
export const getBookFile = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (!book.pdfFile) {
      return res
        .status(404)
        .json({ message: 'No readable file available for this book' });
    }

    const progress = req.user.readingProgress.find(
      (p) => p.book.toString() === book._id.toString()
    );

    res.json({
      pdfUrl: book.pdfFile,
      title: book.title,
      pageCount: book.pageCount,
      currentPage: progress?.currentPage || 1,
    });
  } catch (error) {
    next(error);
  }
};

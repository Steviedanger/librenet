import Book from '../models/Book.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { calculateFine } from '../utils/fineCalculator.js';

const LOAN_DAYS = 14;

/**
 * POST /api/borrow/:bookId — borrow a book (14-day loan).
 */
export const borrowBook = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'No copies available' });
    }

    // Prevent borrowing the same book twice while a loan is active
    const existing = await BorrowRecord.findOne({
      user: req.user._id,
      book: bookId,
      status: 'active',
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: 'You already have this book borrowed' });
    }

    // Block borrowing while the user has any unpaid overdue fine.
    const unpaid = await BorrowRecord.find({
      user: req.user._id,
      finePaid: false,
    });
    const now = new Date();
    const hasOutstandingFine = unpaid.some(
      (r) => (r.returnedAt ? r.fineAmount : calculateFine(r.dueDate, now)) > 0
    );
    if (hasOutstandingFine) {
      return res.status(403).json({
        message:
          'You have outstanding fines. Please visit the library to pay before borrowing.',
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_DAYS);

    const record = await BorrowRecord.create({
      user: req.user._id,
      book: bookId,
      dueDate,
    });

    book.availableCopies -= 1;
    book.totalBorrows += 1;
    await book.save();

    const populated = await record.populate('book');
    res.status(201).json({ record: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/borrow/:recordId/return — return a borrowed book.
 */
export const returnBook = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const record = await BorrowRecord.findById(recordId);
    if (!record) return res.status(404).json({ message: 'Record not found' });

    if (record.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your borrow record' });
    }
    if (record.status === 'returned') {
      return res.status(400).json({ message: 'Book already returned' });
    }

    record.status = 'returned';
    record.returnedAt = new Date();
    // Freeze the accrued fine on the record at the moment of return.
    record.fineAmount = calculateFine(record.dueDate, record.returnedAt);
    await record.save();

    const book = await Book.findById(record.book);
    if (book) {
      book.availableCopies = Math.min(
        book.totalCopies,
        book.availableCopies + 1
      );
      await book.save();
    }

    const populated = await record.populate('book');
    res.json({ record: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/borrow/me — current user's borrow records.
 * Marks active records past their due date as overdue on read.
 */
export const getMyBorrows = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find({ user: req.user._id })
      .populate('book')
      .sort({ borrowedAt: -1 });

    const now = new Date();
    const overdueIds = [];
    const result = records.map((r) => {
      const obj = r.toObject();
      // Surface the live, still-accruing fine for books not yet returned.
      if (r.status !== 'returned') {
        obj.fineAmount = calculateFine(r.dueDate, now);
        if (r.dueDate < now) {
          obj.status = 'overdue';
          if (r.status === 'active') overdueIds.push(r._id);
        }
      }
      return obj;
    });

    if (overdueIds.length) {
      await BorrowRecord.updateMany(
        { _id: { $in: overdueIds } },
        { status: 'overdue' }
      );
    }

    res.json({ records: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/borrow (admin) — all borrow records.
 */
export const getAllBorrows = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find()
      .populate('book', 'title author coverImage')
      .populate('user', 'name email')
      .sort({ borrowedAt: -1 });
    res.json({ records });
  } catch (error) {
    next(error);
  }
};

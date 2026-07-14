import BorrowRecord from '../models/BorrowRecord.js';
import { calculateFine, daysOverdue } from '../utils/fineCalculator.js';

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Current fine on a record. While the book is still out this is computed live
 * so the amount keeps growing; once returned the frozen stored amount is used.
 */
const currentFine = (record, now) =>
  record.returnedAt ? record.fineAmount : calculateFine(record.dueDate, now);

/** Shape a record (with populated book/user) into a fine row for the client. */
const toFineRow = (record, now) => ({
  _id: record._id,
  user: record.user,
  book: record.book,
  borrowedAt: record.borrowedAt,
  dueDate: record.dueDate,
  returnedAt: record.returnedAt,
  daysOverdue: daysOverdue(record.dueDate, record.returnedAt || now),
  fineAmount: currentFine(record, now),
  finePaid: record.finePaid,
  finePaidAt: record.finePaidAt,
  finePaidBy: record.finePaidBy,
  status: record.status,
});

/**
 * GET /api/fines/my-fines — the signed-in student's own unpaid fines.
 */
export const getMyFines = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find({
      user: req.user._id,
      finePaid: false,
    })
      .populate('book', 'title author coverImage')
      .sort({ dueDate: 1 });

    const now = new Date();
    const fines = records
      .map((r) => toFineRow(r, now))
      .filter((f) => f.fineAmount > 0);

    const total = round2(fines.reduce((sum, f) => sum + f.fineAmount, 0));
    res.json({ fines, total, count: fines.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/fines/all (admin) — every fine, paid and unpaid, with user + book.
 * Optional ?status=paid|unpaid filter.
 */
export const getAllFines = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find()
      .populate('book', 'title author coverImage')
      .populate('user', 'name email')
      .sort({ dueDate: 1 });

    const now = new Date();
    let fines = records
      .map((r) => toFineRow(r, now))
      // A record only counts as a "fine" once it has actually accrued money.
      .filter((f) => f.fineAmount > 0 || f.finePaid);

    const { status } = req.query;
    if (status === 'paid') fines = fines.filter((f) => f.finePaid);
    if (status === 'unpaid') fines = fines.filter((f) => !f.finePaid);

    res.json({ fines, count: fines.length });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/fines/:borrowId/pay (admin) — mark a record's fine as paid.
 * Freezes the outstanding amount onto the record at time of payment.
 */
export const payFine = async (req, res, next) => {
  try {
    const record = await BorrowRecord.findById(req.params.borrowId)
      .populate('book', 'title author coverImage')
      .populate('user', 'name email');
    if (!record) return res.status(404).json({ message: 'Borrow record not found' });
    if (record.finePaid) {
      return res.status(400).json({ message: 'This fine is already paid' });
    }

    const now = new Date();
    const fine = currentFine(record, now);
    if (fine <= 0) {
      return res.status(400).json({ message: 'This record has no outstanding fine' });
    }

    record.fineAmount = round2(fine);
    record.finePaid = true;
    record.finePaidAt = now;
    record.finePaidBy = req.user.name || req.user.email;
    await record.save();

    res.json({ record: toFineRow(record, now) });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/fines/summary (admin) — totals for the fines dashboard.
 */
export const getFineSummary = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find();
    const now = new Date();

    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueBooks = 0;

    for (const r of records) {
      if (r.finePaid) {
        totalCollected += r.fineAmount || 0;
        continue;
      }
      if (!r.returnedAt && r.dueDate < now) overdueBooks += 1;
      totalOutstanding += currentFine(r, now);
    }

    res.json({
      totalCollected: round2(totalCollected),
      totalOutstanding: round2(totalOutstanding),
      overdueBooks,
    });
  } catch (error) {
    next(error);
  }
};

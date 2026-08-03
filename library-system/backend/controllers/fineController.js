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
  paymentMethod: record.paymentMethod,
  paymentReference: record.paymentReference,
  paymentStatus: record.paymentStatus,
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
 * PATCH /api/fines/:borrowId/pay (admin) — mark a fine as paid via cash.
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
    record.paymentMethod = 'CASH';
    record.paymentStatus = 'PAID';
    await record.save();

    res.json({ record: toFineRow(record, now) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/fines/:borrowId/initiate-payment (student)
 * Initialises a Paystack transaction for online fine payment.
 * Returns a Paystack authorization_url the frontend redirects to.
 */
export const initiateOnlinePayment = async (req, res, next) => {
  try {
    const record = await BorrowRecord.findById(req.params.borrowId)
      .populate('book', 'title author')
      .populate('user', 'name email');

    if (!record) return res.status(404).json({ message: 'Borrow record not found' });
    if (record.finePaid) {
      return res.status(400).json({ message: 'This fine is already paid' });
    }
    if (record.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pay your own fines' });
    }

    const now = new Date();
    const fine = currentFine(record, now);
    if (fine <= 0) {
      return res.status(400).json({ message: 'This record has no outstanding fine' });
    }

    // Paystack expects amount in the smallest currency unit (pesewas for GHS)
    const amountInPesewas = Math.round(fine * 100);

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: record.user.email,
        amount: amountInPesewas,
        currency: 'GHS',
        reference: `librenet_fine_${record._id}_${Date.now()}`,
        metadata: {
          borrowId: record._id.toString(),
          userId: req.user._id.toString(),
          bookTitle: record.book.title,
          fineAmount: fine,
        },
        callback_url: `${process.env.CLIENT_URL}/fines/verify`,
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status) {
      return res.status(502).json({ message: 'Failed to initiate payment with Paystack' });
    }

    // Mark as pending so we know a payment is in progress
    record.paymentMethod = 'ONLINE';
    record.paymentReference = paystackData.data.reference;
    record.paymentStatus = 'PENDING';
    record.fineAmount = round2(fine); // freeze amount at initiation
    await record.save();

    res.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
      amount: fine,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/fines/verify-payment?reference=xxx (student)
 * Called after Paystack redirects back to the app.
 * Verifies the transaction with Paystack and marks the fine as paid.
 */
export const verifyOnlinePayment = async (req, res, next) => {
  try {
    const { reference } = req.query;
    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // Verify with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      // Mark as failed on our end
      await BorrowRecord.findOneAndUpdate(
        { paymentReference: reference },
        { paymentStatus: 'FAILED' }
      );
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Find the record by reference and mark as fully paid
    const record = await BorrowRecord.findOne({ paymentReference: reference })
      .populate('book', 'title author coverImage')
      .populate('user', 'name email');

    if (!record) {
      return res.status(404).json({ message: 'Borrow record not found for this payment' });
    }

    if (record.finePaid) {
      return res.json({ message: 'Fine already marked as paid', record });
    }

    const now = new Date();
    record.finePaid = true;
    record.finePaidAt = now;
    record.finePaidBy = 'ONLINE (Paystack)';
    record.paymentStatus = 'PAID';
    await record.save();

    res.json({
      message: 'Payment successful! Your fine has been cleared.',
      record: toFineRow(record, now),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/fines/summary (admin) — totals for the fines dashboard.
 * Now includes a breakdown by payment method.
 */
export const getFineSummary = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find();
    const now = new Date();

    let totalCollected = 0;
    let totalCollectedCash = 0;
    let totalCollectedOnline = 0;
    let totalOutstanding = 0;
    let overdueBooks = 0;

    for (const r of records) {
      if (r.finePaid) {
        const amount = r.fineAmount || 0;
        totalCollected += amount;
        if (r.paymentMethod === 'ONLINE') totalCollectedOnline += amount;
        else totalCollectedCash += amount;
        continue;
      }
      if (!r.returnedAt && r.dueDate < now) overdueBooks += 1;
      totalOutstanding += currentFine(r, now);
    }

    res.json({
      totalCollected: round2(totalCollected),
      totalCollectedCash: round2(totalCollectedCash),
      totalCollectedOnline: round2(totalCollectedOnline),
      totalOutstanding: round2(totalOutstanding),
      overdueBooks,
    });
  } catch (error) {
    next(error);
  }
};
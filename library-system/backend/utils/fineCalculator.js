/**
 * Overdue-fine rules for LibreNet.
 *
 * A borrowed book accrues a flat fine for every full day it is kept past its
 * due date. The fine starts accumulating the day AFTER the due date (a book
 * returned within the first 24 hours past due owes nothing) and stops the
 * moment the book is returned.
 */

// GHS charged for each full day a book is overdue.
export const FINE_PER_DAY = 1.5;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Round a currency amount to two decimal places (avoids float drift). */
const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Number of full days a loan is overdue at `returnDate` (0 if not past due).
 */
export const daysOverdue = (dueDate, returnDate = new Date()) => {
  if (!dueDate) return 0;
  const diff = new Date(returnDate).getTime() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / DAY_MS));
};

/**
 * Fine owed on a loan, in GHS.
 * Formula: max(0, daysOverdue) × FINE_PER_DAY — only accrues past the due date.
 */
export const calculateFine = (dueDate, returnDate = new Date()) => {
  return round2(daysOverdue(dueDate, returnDate) * FINE_PER_DAY);
};

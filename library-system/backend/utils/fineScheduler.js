import BorrowRecord from '../models/BorrowRecord.js';
import { calculateFine } from './fineCalculator.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Recalculate and persist fines for every active loan that is past its due
 * date. Returns the number of records whose fine (or status) changed.
 */
export const updateOverdueFines = async () => {
  const now = new Date();
  const records = await BorrowRecord.find({
    returnedAt: null,
    finePaid: false,
    dueDate: { $lt: now },
  });

  let updated = 0;
  for (const record of records) {
    const fine = calculateFine(record.dueDate, now);
    if (record.fineAmount !== fine || record.status !== 'overdue') {
      record.fineAmount = fine;
      record.status = 'overdue';
      await record.save();
      updated += 1;
    }
  }

  console.log(`[fineScheduler] Recalculated fines — updated ${updated} record(s)`);
  return updated;
};

/**
 * Start the recurring fine job: once on boot, then every 24 hours.
 */
export const startFineScheduler = () => {
  updateOverdueFines().catch((err) =>
    console.error('[fineScheduler] initial run failed:', err)
  );

  setInterval(() => {
    updateOverdueFines().catch((err) =>
      console.error('[fineScheduler] run failed:', err)
    );
  }, DAY_MS);
};

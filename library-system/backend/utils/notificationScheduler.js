import BorrowRecord from '../models/BorrowRecord.js';
import Notification from '../models/Notification.js';

export const runNotificationScheduler = async () => {
  try {
    const activeBorrows = await BorrowRecord.find({ status: 'borrowed' }).populate('book user');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const record of activeBorrows) {
      if (!record.user || !record.book) continue;

      const dueDate = new Date(record.dueDate);
      const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      const diffTime = dueDateStart.getTime() - todayStart.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      let type = '';
      let title = '';
      let message = '';

      if (diffDays === 3) {
        type = 'due_soon';
        title = 'Book Due Soon';
        message = `Reminder: "${record.book.title}" is due in 3 days. Please return it on time to avoid fines.`;
      } else if (diffDays === 1) {
        type = 'due_soon';
        title = 'Book Due Tomorrow';
        message = `Urgent: "${record.book.title}" is due tomorrow! Return it to avoid a GHS 1.50/day fine.`;
      } else if (diffDays < 0) {
        const overdueDays = Math.abs(diffDays);
        const currentFine = (overdueDays * 1.5).toFixed(2);
        type = 'overdue';
        title = 'Overdue Book Notice';
        message = `Overdue Notice: "${record.book.title}" is overdue by ${overdueDays} day(s). Your current fine is GHS ${currentFine}. Please return it immediately.`;
      }

      if (type) {
        const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        
        // Prevent duplicate notifications — don't create same type notification for same borrow record on same day
        const existingNotif = await Notification.findOne({
          user: record.user._id,
          type,
          message,
          createdAt: { $gte: todayStart, $lt: tomorrowStart },
        });

        if (!existingNotif) {
          await Notification.create({
            user: record.user._id,
            title,
            message,
            type,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error running notification scheduler:', error);
  }
};

export const startNotificationScheduler = () => {
  // Run immediately when server boots
  runNotificationScheduler();
  // Run every 24 hours (24 * 60 * 60 * 1000 ms)
  setInterval(runNotificationScheduler, 86400000);
};
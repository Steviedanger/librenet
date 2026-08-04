import User from '../models/User.js';
import Book from '../models/Book.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { saveUpload, removeUpload } from '../utils/fileStorage.js';
import { awardBadges } from '../utils/badgeEngine.js';

/**
 * GET /api/users/me — current profile.
 */
export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * PUT /api/users/me — update name, avatar and/or password.
 */
export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    const { name, currentPassword, newPassword } = req.body;

    if (name) user.name = name;

    if (req.file) {
      await removeUpload(user.avatarPublicId);
      const saved = await saveUpload(req.file, 'avatar');
      user.avatar = saved.url;
      user.avatarPublicId = saved.publicId;
    }

    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ message: 'Current password is required to set a new one' });
      }
      const match = await user.comparePassword(currentPassword);
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ message: 'New password must be at least 6 characters' });
      }
      user.password = newPassword;
    }

    await user.save();
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/bookmarks/:bookId — toggle a bookmark on/off.
 */
export const toggleBookmark = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const user = await User.findById(req.user._id);
    const idx = user.bookmarks.findIndex((b) => b.book.toString() === bookId);

    let bookmarked;
    if (idx >= 0) {
      user.bookmarks.splice(idx, 1);
      bookmarked = false;
    } else {
      user.bookmarks.push({ book: bookId });
      bookmarked = true;
    }

    await user.save();
    res.json({ bookmarked, bookmarks: user.bookmarks });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/bookmarks — populated bookmarked books.
 */
export const getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('bookmarks.book');
    const books = user.bookmarks
      .filter((b) => b.book)
      .map((b) => ({ ...b.book.toObject(), bookmarkedAt: b.addedAt }));
    res.json({ books });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/progress/:bookId — save the last page read.
 * If isCompleted=true, marks the book as fully read and awards badges.
 */
export const saveProgress = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { currentPage, isCompleted = false } = req.body;

    if (!currentPage || currentPage < 1) {
      return res.status(400).json({ message: 'A valid currentPage is required' });
    }

    const user = await User.findById(req.user._id);
    const existing = user.readingProgress.find(
      (p) => p.book.toString() === bookId
    );

    if (existing) {
      existing.currentPage = currentPage;
      existing.updatedAt = new Date();
      if (isCompleted && !existing.completed) {
        existing.completed = true;
        existing.completedAt = new Date();
      }
    } else {
      user.readingProgress.push({
        book: bookId,
        currentPage,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
      });
    }

    let newBadges = [];

    if (isCompleted && (!existing || !existing.completed)) {
      user.totalBooksRead += 1;
      newBadges = await awardBadges(user);
    } else {
      await user.save();
    }

    res.json({
      message: isCompleted ? 'Book marked as completed!' : 'Progress saved',
      currentPage,
      completed: isCompleted,
      newBadges,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/progress — reading history with progress per book.
 */
export const getProgress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'readingProgress.book'
    );
    const items = user.readingProgress
      .filter((p) => p.book)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map((p) => ({
        book: p.book,
        currentPage: p.currentPage,
        updatedAt: p.updatedAt,
        completed: p.completed || false,
        completedAt: p.completedAt || null,
        percent: p.book.pageCount
          ? Math.min(100, Math.round((p.currentPage / p.book.pageCount) * 100))
          : 0,
      }));
    res.json({ items });
  } catch (error) {
    next(error);
  }
};

/* ----------------------------- Admin endpoints ---------------------------- */

/**
 * GET /api/users (admin) — list all users.
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/status (admin) — activate / deactivate an account.
 */
export const setUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: 'You cannot change your own status' });
    }

    user.isActive = Boolean(isActive);
    await user.save();
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/verify (admin) — mark an account as verified.
 */
export const verifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id/role (admin) — promote or demote a user.
 */
export const setUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be student or admin' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: 'You cannot change your own role' });
    }

    user.role = role;
    await user.save();
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/stats (admin) — basic dashboard summary numbers.
 */
export const getStats = async (req, res, next) => {
  try {
    const [totalBooks, totalUsers, activeBorrows, copiesAgg] =
      await Promise.all([
        Book.countDocuments(),
        User.countDocuments(),
        BorrowRecord.countDocuments({ status: 'active' }),
        Book.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: '$totalCopies' },
              available: { $sum: '$availableCopies' },
            },
          },
        ]),
      ]);

    const copies = copiesAgg[0] || { total: 0, available: 0 };

    res.json({
      totalBooks,
      totalUsers,
      booksBorrowed: activeBorrows,
      totalCopies: copies.total,
      availableCopies: copies.available,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/analytics (admin) — rich analytics data for the dashboard.
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const yearNum = Number(year);

    const startOfYear = new Date(`${yearNum}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${yearNum}-12-31T23:59:59.999Z`);

    const [
      mostBorrowedBooks,
      mostActiveUsers,
      genrePopularity,
      monthlyBorrows,
      fineStats,
      overdueCount,
      newUsersMonthly,
    ] = await Promise.all([

      // Top 10 most borrowed books
      Book.find()
        .sort({ totalBorrows: -1 })
        .limit(10)
        .select('title author genre totalBorrows coverImage availableCopies totalCopies'),

      // Top 10 most active students by total borrows
      BorrowRecord.aggregate([
        {
          $group: {
            _id: '$user',
            totalBorrows: { $sum: 1 },
            returnedOnTime: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'returned'] },
                      { $lte: ['$returnedAt', '$dueDate'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { totalBorrows: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            email: '$user.email',
            libraryId: '$user.libraryId',
            avatar: '$user.avatar',
            totalBorrows: 1,
            returnedOnTime: 1,
          },
        },
      ]),

      // Genre popularity — total borrows per genre
      BorrowRecord.aggregate([
        {
          $lookup: {
            from: 'books',
            localField: 'book',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: '$book' },
        {
          $group: {
            _id: '$book.genre',
            totalBorrows: { $sum: 1 },
          },
        },
        { $sort: { totalBorrows: -1 } },
        { $limit: 10 },
        {
          $project: {
            genre: '$_id',
            totalBorrows: 1,
            _id: 0,
          },
        },
      ]),

      // Monthly borrows for the selected year
      BorrowRecord.aggregate([
        {
          $match: {
            borrowedAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: { $month: '$borrowedAt' },
            totalBorrows: { $sum: 1 },
            returned: {
              $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] },
            },
            overdue: {
              $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Fine stats — total collected, total outstanding
      BorrowRecord.aggregate([
        {
          $group: {
            _id: null,
            totalCollected: {
              $sum: { $cond: ['$finePaid', '$fineAmount', 0] },
            },
            totalRecords: { $sum: 1 },
            fineRecords: {
              $sum: { $cond: [{ $gt: ['$fineAmount', 0] }, 1, 0] },
            },
          },
        },
      ]),

      // Current overdue count
      BorrowRecord.countDocuments({ status: 'overdue' }),

      // New user registrations per month for selected year
      User.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build full 12-month arrays with zeros for empty months
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyBorrowsMap = {};
    monthlyBorrows.forEach((m) => { monthlyBorrowsMap[m._id] = m; });

    const newUsersMap = {};
    newUsersMonthly.forEach((m) => { newUsersMap[m._id] = m.count; });

    const monthlyData = MONTHS.map((month, i) => {
      const monthNum = i + 1;
      const data = monthlyBorrowsMap[monthNum] || { totalBorrows: 0, returned: 0, overdue: 0 };
      return {
        month,
        totalBorrows: data.totalBorrows,
        returned: data.returned,
        overdue: data.overdue,
        newUsers: newUsersMap[monthNum] || 0,
      };
    });

    const fineData = fineStats[0] || { totalCollected: 0, totalRecords: 0, fineRecords: 0 };

    res.json({
      mostBorrowedBooks,
      mostActiveUsers,
      genrePopularity,
      monthlyData,
      fineStats: {
        totalCollected: Math.round(fineData.totalCollected * 100) / 100,
        fineRecords: fineData.fineRecords,
        overdueCount,
      },
      year: yearNum,
      availableYears: [yearNum - 2, yearNum - 1, yearNum].filter(y => y >= 2024),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/export/borrows (admin) — export borrow records as CSV.
 */
export const exportBorrowsCSV = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find()
      .populate('book', 'title author genre isbn')
      .populate('user', 'name email libraryId')
      .sort({ borrowedAt: -1 });

    const headers = [
      'Library ID',
      'Student Name',
      'Email',
      'Book Title',
      'Author',
      'Genre',
      'ISBN',
      'Borrowed Date',
      'Due Date',
      'Returned Date',
      'Status',
      'Fine Amount (GHS)',
      'Fine Paid',
      'Payment Method',
    ];

    const rows = records.map((r) => [
      r.user?.libraryId || '',
      r.user?.name || '',
      r.user?.email || '',
      r.book?.title || 'Deleted book',
      r.book?.author || '',
      r.book?.genre || '',
      r.book?.isbn || '',
      r.borrowedAt ? new Date(r.borrowedAt).toLocaleDateString() : '',
      r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '',
      r.returnedAt ? new Date(r.returnedAt).toLocaleDateString() : '',
      r.status || '',
      r.fineAmount ? r.fineAmount.toFixed(2) : '0.00',
      r.finePaid ? 'Yes' : 'No',
      r.paymentMethod || 'N/A',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="librenet-borrows-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/export/fines (admin) — export fine records as CSV.
 */
export const exportFinesCSV = async (req, res, next) => {
  try {
    const records = await BorrowRecord.find({ fineAmount: { $gt: 0 } })
      .populate('book', 'title author')
      .populate('user', 'name email libraryId')
      .sort({ borrowedAt: -1 });

    const headers = [
      'Library ID',
      'Student Name',
      'Email',
      'Book Title',
      'Author',
      'Due Date',
      'Returned Date',
      'Days Overdue',
      'Fine Amount (GHS)',
      'Fine Paid',
      'Payment Method',
      'Paid Date',
      'Paid By',
    ];

    const rows = records.map((r) => {
      const dueDate = new Date(r.dueDate);
      const returnDate = r.returnedAt ? new Date(r.returnedAt) : new Date();
      const daysOverdue = Math.max(0, Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24)));

      return [
        r.user?.libraryId || '',
        r.user?.name || '',
        r.user?.email || '',
        r.book?.title || 'Deleted book',
        r.book?.author || '',
        dueDate.toLocaleDateString(),
        r.returnedAt ? new Date(r.returnedAt).toLocaleDateString() : 'Not returned',
        daysOverdue,
        r.fineAmount ? r.fineAmount.toFixed(2) : '0.00',
        r.finePaid ? 'Yes' : 'No',
        r.paymentMethod || 'N/A',
        r.finePaidAt ? new Date(r.finePaidAt).toLocaleDateString() : '',
        r.finePaidBy || '',
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="librenet-fines-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
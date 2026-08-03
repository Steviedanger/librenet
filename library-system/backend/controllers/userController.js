import User from '../models/User.js';
import Book from '../models/Book.js';
import BorrowRecord from '../models/BorrowRecord.js';
import { saveUpload, removeUpload } from '../utils/fileStorage.js';

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
      // Replace any previous avatar so we don't orphan files.
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
 */
export const saveProgress = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const { currentPage } = req.body;
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
    } else {
      user.readingProgress.push({ book: bookId, currentPage });
    }

    await user.save();
    res.json({ message: 'Progress saved', currentPage });
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
 * PATCH /api/users/:id/verify (admin) — mark an account as verified so the
 * user can log in, without needing to edit MongoDB by hand.
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
 * PATCH /api/users/:id/role (admin) — promote a user to admin or demote to
 * student.
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
 * GET /api/users/stats (admin) — dashboard summary numbers.
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

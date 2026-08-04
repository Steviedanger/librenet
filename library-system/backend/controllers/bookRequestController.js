import BookRequest from '../models/BookRequest.js';

/**
 * POST /api/requests — student submits a book request.
 */
export const createRequest = async (req, res, next) => {
  try {
    const { title, author, isbn, genre, description, reason } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    // Prevent duplicate requests from same user for same book
    const existing = await BookRequest.findOne({
      user: req.user._id,
      title: { $regex: new RegExp(`^${title.trim()}$`, 'i') },
      author: { $regex: new RegExp(`^${author.trim()}$`, 'i') },
      status: { $in: ['pending', 'approved'] },
    });

    if (existing) {
      return res.status(409).json({
        message: 'You already have a pending request for this book.',
      });
    }

    const request = await BookRequest.create({
      user: req.user._id,
      title: title.trim(),
      author: author.trim(),
      isbn: isbn?.trim() || '',
      genre: genre?.trim() || '',
      description: description?.trim() || '',
      reason: reason?.trim() || '',
    });

    const populated = await request.populate('user', 'name email libraryId');
    res.status(201).json({ request: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/my-requests — student sees their own requests.
 */
export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await BookRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ requests, count: requests.length });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/requests/:id — student cancels their own pending request.
 */
export const cancelRequest = async (req, res, next) => {
  try {
    const request = await BookRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending requests can be cancelled',
      });
    }

    await request.deleteOne();
    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/all (admin) — all requests with optional status filter.
 */
export const getAllRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await BookRequest.find(filter)
      .populate('user', 'name email libraryId')
      .sort({ createdAt: -1 });

    res.json({ requests, count: requests.length });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/review (admin) — approve, reject or mark as added.
 */
export const reviewRequest = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;

    if (!['approved', 'rejected', 'added'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be approved, rejected or added',
      });
    }

    const request = await BookRequest.findById(req.params.id)
      .populate('user', 'name email libraryId');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    request.adminNote = adminNote?.trim() || '';
    request.reviewedBy = req.user.name || req.user.email;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ request });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests/summary (admin) — counts by status.
 */
export const getRequestSummary = async (req, res, next) => {
  try {
    const [pending, approved, rejected, added] = await Promise.all([
      BookRequest.countDocuments({ status: 'pending' }),
      BookRequest.countDocuments({ status: 'approved' }),
      BookRequest.countDocuments({ status: 'rejected' }),
      BookRequest.countDocuments({ status: 'added' }),
    ]);

    res.json({ pending, approved, rejected, added, total: pending + approved + rejected + added });
  } catch (error) {
    next(error);
  }
};
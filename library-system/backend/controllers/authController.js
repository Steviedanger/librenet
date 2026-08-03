import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail, { emailTemplate } from '../utils/sendEmail.js';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const REFRESH_COOKIE = 'refreshToken';

const signAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TTL,
  });

const signRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });

// Cookie options for the refresh token. secure is on outside development.
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * POST /api/auth/register
 * Create an unverified student and email a verification link.
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      verificationToken: hashToken(rawToken),
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;

    // Accounts are verified manually. Resend can't deliver to arbitrary
    // recipients without a verified domain, but it can reach the account
    // owner's own address, so notify the admin to go verify the new user.
    const adminEmail = process.env.ADMIN_EMAIL || 'mccarthystephen363@gmail.com';

    await sendEmail({
      to: adminEmail,
      subject: `New account awaiting verification: ${user.name}`,
      html: emailTemplate(
        'New account created',
        `<p>A new reader just registered and is waiting to be verified.</p>
         <p><strong>Name:</strong> ${user.name}<br/>
         <strong>Email:</strong> ${user.email}</p>
         <p>Verify them with one click:</p>
         <p><a href="${verifyUrl}" style="display:inline-block;background:#9cc5a1;color:#0f1b2d;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">Verify this account</a></p>
         <p>Or set <code>isVerified: true</code> on their user document in MongoDB.</p>`
      ),
      text: `New signup: ${user.name} (${user.email}). Verify: ${verifyUrl}`,
    });

    res.status(201).json({
      message: 'Registration successful. Your account is awaiting verification.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify-email?token=&email=
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) {
      return res.status(400).json({ message: 'Invalid verification link' });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      verificationToken: hashToken(String(token)),
    }).select('+verificationToken');

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Verification link is invalid or expired' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: 'Email verified. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: 'Please verify your email before logging in' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    res.json({ accessToken, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 * Validate the refresh cookie and issue a fresh access token.
 */
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: 0 });
  res.json({ message: 'Logged out' });
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });

    // Always respond the same way to avoid leaking which emails exist
    if (!user) {
      return res.json({
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(
      user.email
    )}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your LibreNet Library password',
      html: emailTemplate(
        'Password reset',
        `<p>We received a request to reset your password.</p>
         <p><a href="${resetUrl}" style="display:inline-block;background:#9cc5a1;color:#0f1b2d;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
         <p>This link expires in 1 hour.</p>
         <p>Or paste this link into your browser:<br/>${resetUrl}</p>`
      ),
      text: `Reset your password: ${resetUrl}`,
    });

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      resetPasswordToken: hashToken(String(token)),
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Reset link is invalid or has expired' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

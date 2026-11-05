
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

const generatePlayerId = async () => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const playerId = String(
      crypto.randomInt(1000, 10000)
    );

    const existingUser = await User.exists({ playerId });

    if (!existingUser) {
      return playerId;
    }
  }

  throw new Error("Could not generate a unique player ID.");
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Username must be between 3 and 20 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 128 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const playerId = await generatePlayerId();
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      playerId,
      isVerified: false,
      verificationTokenHash,
      verificationTokenExpires: new Date(
        Date.now() + 30 * 60 * 1000
      ),
    });

    const verificationUrl =
      `${process.env.BASE_URL}/verify-email` +
      `?token=${verificationToken}` +
      `&email=${encodeURIComponent(cleanEmail)}`;

    try {
      await sendEmail({
        to: cleanEmail,
        subject: "Verify your DuoPlay611 account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>Welcome to DuoPlay611, ${escapeHtml(cleanUsername)}!</h2>
            <p>Please verify your email address to activate your account.</p>
            <p>
              <a
                href="${verificationUrl}"
                style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;"
              >
                Verify my email
              </a>
            </p>
            <p>This link expires in 30 minutes.</p>
            <p>If you did not create this account, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Avoid leaving an unusable, unverified account behind.
      await User.deleteOne({ _id: user._id });

      console.error("Verification email failed:", emailError.message);

      return res.status(503).json({
        success: false,
        message:
          "We could not send your verification email. Please try again later.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created. Check your email to verify your account.",
      user: {
        username: user.username,
        email: user.email,
        playerId: user.playerId,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That email or player ID is already in use. Please try again.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (
      typeof token !== "string" ||
      typeof email !== "string" ||
      !/^[a-f0-9]{64}$/.test(token)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      email: cleanEmail,
    }).select(
      "+verificationTokenHash +verificationTokenExpires"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Your email is already verified. You can log in.",
      });
    }

    if (
      !user.verificationTokenHash ||
      !user.verificationTokenExpires ||
      user.verificationTokenExpires.getTime() < Date.now() ||
      user.verificationTokenHash !== tokenHash
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Email verification failed. Please try again.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        playerId: user.playerId,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again later.",
    });
  }
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      playerId: req.user.playerId,
      profilePicture: req.user.profilePicture,
      isVerified: req.user.isVerified,
    },
  });
};

const UserModel = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const transporter = require("../../config/mailer");
require("dotenv").config();

const SALT_ROUNDS = 10;

exports.signup = async ({ username, email, password, role }) => {
  const existingUser = await UserModel.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email) throw new Error("Email already exists");
    if (existingUser.username === username)
      throw new Error("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = new UserModel({
    username,
    email,
    password: hashedPassword,
    role,
    approval: role === "customer" ? "approved" : "pending",
    music_first_timer: true,
    art_first_timer: true,
  });

  await newUser.save();

  if (role === "customer") {
    const token = jwt.sign(
      { username, email, role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // CALL notification service
    await axios.post("http://localhost:10000/api/send-verification-email", {
      email,
      username,
      token,
    });
    
    return { message: "Verification email sent", token };
  }

  if (role === "music_entry_clerk") {
    await axios.post("http://localhost:10000/api/send-admin-approval-email", {
        adminEmail: process.env.ADMIN_EMAIL_TEST,
        username,
        email,
    });
    return { message: "Submitted for approval" };
  }

  throw new Error("Invalid role");
};

exports.verifyEmail = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await UserModel.findOne({ email: decoded.email });
  if (!user) throw new Error("User not found");

  return { approval: user.approval };
};

exports.getLoginSession = async (session) => {
  if (!session.userId) throw new Error("No active session");

  const user = await UserModel.findById(session.userId);
  if (!user) throw new Error("User not found");

  return {
    message: "Success",
    userId: user._id,
    role: user.role,
    music_first_timer: user.music_first_timer,
    art_first_timer: user.art_first_timer,
    approval: user.approval,
  };
};

exports.login = async ({ username_or_email, password }, session) => {
  if (!username_or_email || !password)
    throw new Error("Missing credentials");

  const user = await UserModel.findOne({
    $or: [
      { email: username_or_email },
      { username: username_or_email },
    ],
  });

  if (!user) throw new Error("Invalid credentials");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid credentials");

  session.userId = user._id.toString();
  session.username = user.username;
  session.loginTime = new Date().toISOString();

  await new Promise((resolve, reject) => {
    session.save((err) => (err ? reject(err) : resolve()));
  });

  user.sessionId = session.id;
  await user.save();

  return {
    message: "Success",
    userId: user._id,
    role: user.role,
    approval: user.approval,
    music_first_timer: user.music_first_timer,
    art_first_timer: user.art_first_timer,
    sessionId: session.id,
  };
};

exports.logout = async (session) => {
  const userId = session.userId;

  if (!userId) throw new Error("No active session");

  await UserModel.findByIdAndUpdate(userId, { sessionId: null });

  return new Promise((resolve, reject) => {
    session.destroy((err) => {
      if (err) reject(err);
      else resolve({ message: "Logged out successfully" });
    });
  });
};

exports.getCurrentUser = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");
  return user;
};

exports.forgotPassword = async (email) => {
  // 1. Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  // 2. Check user
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new Error("Email not found");
  }

  // 3. Generate token
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  // 4. Build reset link
  const frontendUrl =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_PROD_URL
      : process.env.FRONTEND_DEV_URL;

  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  // 5. Email template
    const emailTemplate = `
  <div style="border: 2px solid #8BD3E6; border-radius: 10px; padding: 20px; font-family: 'Montserrat', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F9FBFC;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #8BD3E6; font-size: 28px; margin: 0; font-weight: bold;">Reset Your Password</h1>
      <p style="color: #6C757D; font-size: 16px; margin: 5px 0 0;">We received a request to reset your password.</p>
    </div>
    <div style="padding: 20px; background: #FFFFFF; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);">
      <p style="color: #555555; font-size: 14px; line-height: 1.6;">
        You requested to reset your password. Please click the button below to proceed:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="display: inline-block; padding: 12px 25px; font-size: 14px; font-weight: bold; color: #FFFFFF; background-color: #8BD3E6; border-radius: 5px; text-decoration: none;">
          RESET PASSWORD
        </a>
      </div>
      <p style="color: #6C757D; font-size: 12px; text-align: center; margin-top: 20px;">
        If you did not request this password reset, please ignore this email.
      </p>
    </div>
  </div>
`;

  // 6. Send email
  await transporter.sendMail({
    from: '"N.A.S.I.R Music System" <nasir.music.system@gmail.com>',
    to: email,
    subject: "Password Reset",
    html: emailTemplate,
  });
};

exports.resetPassword = async (token, newPassword) => {
  // 1. Verify token
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    throw new Error("Invalid token");
  }

  const userId = decoded.userId;

  // 2. Validate password
  const passwordRegex = /^(?=.*\d)[a-zA-Z\d]{8,}$/;

  if (!passwordRegex.test(newPassword)) {
    throw new Error("Invalid password format");
  }

  // 3. Find user
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new Error("Invalid or expired token");
  }

  // 4. Hash password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // 5. Update password
  user.password = hashedPassword;
  await user.save();
};

exports.clearSession = (req) => {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      return resolve(); // no session is fine
    }

    req.session.destroy((err) => {
      if (err) {
        return reject(new Error("Failed to destroy session"));
      }
      resolve();
    });
  });
};
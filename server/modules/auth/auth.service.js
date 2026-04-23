const UserModel = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");

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
    first_timer: true,
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
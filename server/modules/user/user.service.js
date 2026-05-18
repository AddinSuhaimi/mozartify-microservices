const ABCFileModel = require("../../models/ABCFile");
const ArtworkModel = require("../../models/Artwork");
const mongoose = require("mongoose");
const UserModel = require("../../models/User");
const DeletedUserModel = require("../../models/DeletedUser");
const bcrypt = require("bcryptjs");
const uploadService = require("../../shared/upload/upload.service");

const SALT_ROUNDS = 10;

// Import payment service for querying purchases
let paymentService;
try {
  paymentService = require("../payment/payment.service");
} catch (err) {
  console.warn("Payment service not available");
}

exports.getMusicPreferencesOptions = async () => {
    const composers = await ABCFileModel.distinct("composer");
    const genres = await ABCFileModel.distinct("genre");
    const emotions = await ABCFileModel.distinct("emotion");

    return { composers, genres, emotions };
};

exports.getArtPreferencesOptions = async () => {
    const artist = await ArtworkModel.distinct("artist");
    const collection = await ArtworkModel.distinct("collection");

    return { artist, collection };
};

exports.updateMusicPreferences = async (userId, preferences) => {
    const { composer_preferences, genre_preferences, emotion_preferences } = preferences;

    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
            composer_preferences,
            genre_preferences,
            emotion_preferences,
            music_first_timer: false,
        },
        { new: true }
    );

    if(!updatedUser) {
        throw new Error("User not found or preferences not updated");
    }

    return updatedUser;
};

exports.updateArtPreferences = async (userId, preferences) => {
    const { artist_preferences, collection_preferences } = preferences;

    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
            artist_preferences,
            collection_preferences,
            art_first_timer: false,
        },
        { new: true }
    );

    if(!updatedUser) {
        throw new Error("User not found or preferences not updated");
    }

    return updatedUser;
};

exports.getUserLibrary = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!paymentService) {
    throw new Error("Payment service not available");
  }

  // Get purchases from payment service (source of truth)
  const purchases = await paymentService.getUserPurchases(userId);

  // Optionally enrich with music/score data
  if (purchases.length > 0) {
    const scoreIds = purchases.map(p => p.score_id);
    const scores = await ABCFileModel.find({ _id: { $in: scoreIds } });
    return { purchases, scores };
  }

  return { purchases: [], scores: [] };
};

exports.getUserArtworkLibrary = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!paymentService) {
    throw new Error("Payment service not available");
  }

  // Get artwork purchases from payment service (source of truth)
  const purchases = await paymentService.getUserArtworkPurchases(userId);

  // Optionally enrich with artwork data
  if (purchases.length > 0) {
    const artworkIds = purchases.map(p => p.artwork_id);
    const artworks = await ArtworkModel.find({ _id: { $in: artworkIds } });
    return { purchases, artworks };
  }

  return { purchases: [], artworks: [] };
};

exports.getUserComposedScores = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await UserModel.findById(userId);

  if (!user || !user.composed_score_ids || user.composed_score_ids.length === 0) {
    throw new Error("No composed scores found");
  }

  const composedScores = await ABCFileModel.find({
    _id: { $in: user.composed_score_ids },
  });

  return composedScores;
};

exports.deleteUser = async (userId) => {
  // 1. Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  // 2. Find user
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // 3. Move to DeletedUser collection
  const deletedUser = new DeletedUserModel({
    username: user.username,
    email: user.email,
    password: user.password,
    role: user.role,
    approval: user.approval,
    favorites_music: user.favorites_music,
    favorites_art: user.favorites_art,
    deletedAt: new Date(),
  });

  await deletedUser.save();

  // 4. Delete original user
  await UserModel.findByIdAndDelete(userId);
};

exports.updateUsername = async (userId, username) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  const existingUser = await UserModel.findOne({
    username,
    _id: { $ne: userId },
  });

  if (existingUser) {
    throw new Error("Username already taken");
  }

  user.username = username;
  await user.save();

  return {
    username: user.username,
    email: user.email,
    profile_picture: user.profile_picture,
  };
};


exports.changePassword = async (userId, currentPassword, newPassword) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const passwordRegex = /^(?=.*\d)[a-zA-Z\d]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new Error("Invalid password format");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  user.password = hashedPassword;
  await user.save();
};

exports.uploadProfilePicture = async (userId, file) => {
  const profilePictureUrl =
    await uploadService.uploadFileToFirebase(
      file,
      "profile_pictures"
    );

  return await exports.updateProfilePicture(
    userId,
    profilePictureUrl
  );
};

exports.updateProfilePicture = async (userId, profilePictureUrl) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  user.profile_picture = profilePictureUrl;
  await user.save();

  return {
    username: user.username,
    email: user.email,
    profile_picture: user.profile_picture,
  };
};

// ========== ADMIN USER MANAGEMENT ==========

exports.getAllUsers = async () => {
  return await UserModel.find();
};

exports.getUserById = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

exports.createUser = async (userData) => {
  const { username, email, password, role } = userData;

  if (!username || !email || !password || !role) {
    throw new Error("All fields are required");
  }

  const existingUser = await UserModel.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new Error("User with this username or email already exists");
  }

  const defaultApproval = role === "customer" ? "approved" : "pending";
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = new UserModel({
    username,
    email,
    password: hashedPassword,
    role,
    approval: defaultApproval,
  });

  return await newUser.save();
};

exports.updateUser = async (userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const { username, email, role } = updateData;

  if (!username || !email || !role) {
    throw new Error("Username, email, and role are required");
  }

  const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

exports.updateApprovalStatus = async (userId, approval) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  if (!["approved", "pending", "denied"].includes(approval)) {
    throw new Error("Invalid approval status");
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { approval },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

exports.deleteUserAdmin = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const existingDeletedUser = await DeletedUserModel.findOne({
    email: user.email,
  });

  if (!existingDeletedUser) {
    const deletedUser = new DeletedUserModel(user.toObject());
    await deletedUser.save();
  }

  await UserModel.findByIdAndDelete(userId);

  return {
    message: "User deleted successfully and transferred to deletedusers collection",
  };
};

exports.addToDeletedUsers = async (userData) => {
  const { username, email, password, role, approval, deletedAt } = userData;

  if (!username || !email || !password || !role || !approval) {
    throw new Error("All fields are required");
  }

  const existingDeletedUser = await DeletedUserModel.findOne({ email });
  if (existingDeletedUser) {
    throw new Error("User already exists in deletedusers");
  }

  const deletedUser = new DeletedUserModel({
    username,
    email,
    password,
    role,
    approval,
    deletedAt: deletedAt || new Date(),
  });

  return await deletedUser.save();
};
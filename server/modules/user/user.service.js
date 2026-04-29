const ABCFileModel = require("../../models/ABCFile");
const ArtworkModel = require("../../models/Artwork");
const mongoose = require("mongoose");
const UserModel = require("../../models/User");
const CartModel = require("../../models/Cart");
const DeletedUserModel = require("../../models/DeletedUser");
const bcrypt = require("bcryptjs");

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
            first_timer: false,
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

exports.getUserCart = async (userId) => {
  const cart = await CartModel.findOne({ user_id: userId });

  if (!cart || !cart.score_ids || cart.score_ids.length === 0) {
    return [];
  }

  const cartItems = cart.score_ids.map((scoreId) => ({
    score_id: scoreId,
  }));

  return cartItems;
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
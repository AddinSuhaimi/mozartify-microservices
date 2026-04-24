const ABCFileModel = require("../../models/ABCFile");
const ArtworkModel = require("../../models/Artwork");
const mongoose = require("mongoose");
const UserModel = require("../../models/User");
const CartModel = require("../../models/Cart");

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
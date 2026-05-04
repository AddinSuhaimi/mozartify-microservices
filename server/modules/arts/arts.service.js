const ArtworkModel = require("../../models/Artwork");
const Cart2Model = require("../../models/Cart2");
const mongoose = require("mongoose");

exports.getArtworkRefineSearch = async () => {
  const sample = await ArtworkModel.findOne().lean();

  if (!sample) {
    return {};
  }

  const excludeFields = [
    "_id",
    "__v",
    "downloads",
    "deleted",
    "price",
    "imageUrl",
    "dateUploaded",
    "createdAt",
    "updatedAt",
    "title",
  ];

  const fieldsToFilter = Object.keys(sample).filter(
    (key) => !excludeFields.includes(key)
  );

  const filters = {};

  for (const field of fieldsToFilter) {
    filters[field] = await ArtworkModel.distinct(field);
  }

  return filters;
};

const buildArtworkQuery = (combinedQueries, selectedCollection, queryText, filters) => {
  let conditions = [];

  const fieldMap = {
    Title: "title",
    Artist: "artist",
    Collection: "collection",
  };

  // simple search
  if (queryText && queryText.trim() !== "") {
    conditions.push({
      $or: [
        { title: { $regex: queryText, $options: "i" } },
        { artist: { $regex: queryText, $options: "i" } },
        { collection: { $regex: queryText, $options: "i" } },
      ],
    });
  }

  // advanced search
  if (combinedQueries && combinedQueries.length > 0) {
    combinedQueries.forEach((row) => {
      const category = row.searchCategory || row.category;
      const text = row.searchText || row.text;

      if (!category || !text) return;

      if (category === "All") {
        conditions.push({
          $or: Object.values(fieldMap).map((field) => ({
            [field]: { $regex: text, $options: "i" },
          })),
        });
      } else {
        const field = fieldMap[category];
        if (!field) return;

        conditions.push({
          [field]: { $regex: text, $options: "i" },
        });
      }
    });
  }

  // filters
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;

      // support array or single value
      if (Array.isArray(value)) {
        conditions.push({ [key]: { $in: value } });
      } else {
        conditions.push({ [key]: { $in: [value] } });
      }
    }
  }

  if (selectedCollection && selectedCollection !== "All") {
    conditions.push({ collection: selectedCollection });
  }

  if (conditions.length === 1) return conditions[0];
  if (conditions.length > 1) return { $and: conditions };

  return {};
};

exports.checkArtworkPurchase = async ({ artwork_id, user_id }) => {
  if (!artwork_id || !user_id) {
    throw new Error("Missing artwork_id or user_id");
  }

  const Purchase2Model = require("../../models/Purchase2");
  const purchases = await Purchase2Model.find({ artwork_id, user_id });

  if (purchases.length > 0) {
    return { exists: true, data: purchases };
  } else {
    return { exists: false, data: [] };
  }
};

exports.searchArtwork = async (body) => {
  const { combinedQueries, selectedCollection, query, filters } = body;

  const mongoQuery = buildArtworkQuery(
    combinedQueries,
    selectedCollection,
    query,
    filters
  );

  return await ArtworkModel.find(mongoQuery);
};

exports.getUserArtworkCart = async (userId) => {
  const cart = await Cart2Model.findOne({ user_id: userId });

  if (!cart || cart.artwork_ids.length === 0) {
    return [];
  }

  return cart.artwork_ids.map((artworkId) => ({
    artwork_id: artworkId,
  }));
};

exports.getArtworkById = async (artworkId) => {
  let artwork;

  if (mongoose.Types.ObjectId.isValid(artworkId)) {
    artwork = await ArtworkModel.findById(artworkId);
  } else {
    artwork = await ArtworkModel.findOne({ filename: artworkId });
  }

  if (!artwork) {
    throw new Error("Artwork not found");
  }

  return artwork;
};

exports.getArtworksByIds = async (artworkIds) => {
  if (!artworkIds || artworkIds.length === 0) {
    throw new Error("No artwork IDs provided");
  }

  const artworks = await ArtworkModel.find({
    _id: { $in: artworkIds },
  });

  if (artworks.length === 0) {
    throw new Error("No artworks found");
  }

  return artworks;
};

exports.getPopularArtworks = async () => {
  const popularArtworks = await ArtworkModel.find()
    .sort({ downloads: -1 })
    .limit(10);

  return popularArtworks;
};

exports.getUserLikedArtworks = async (userId) => {
  const UserModel = require("../../models/User");
  const user = await UserModel.findById(userId);

  if (!user || !user.favorites_art || user.favorites_art.length === 0) {
    throw new Error("No liked artworks found");
  }

  const likedArtworks = await ArtworkModel.find({
    _id: { $in: user.favorites_art },
  });

  return likedArtworks;
};

exports.addToCart = async (userId, artworkId) => {
  let cart = await Cart2Model.findOne({ user_id: userId });

  if (!cart) {
    cart = new Cart2Model({
      user_id: userId,
      artwork_ids: [artworkId],
    });
  } else {
    if (!cart.artwork_ids.some(id => id.toString() === artworkId)) {
      cart.artwork_ids.push(artworkId);
    }
  }

  await cart.save();
};

exports.removeFromCart = async (userId, artworkId) => {
  const cart = await Cart2Model.findOneAndUpdate(
    { user_id: userId },
    { $pull: { artwork_ids: artworkId } },
    { new: true }
  );

  if (!cart) {
    throw new Error("Cart not found");
  }

  return cart;
};
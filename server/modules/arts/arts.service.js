const ArtworkModel = require("../../models/Artwork");
const Cart2Model = require("../../models/Cart2");
const mongoose = require("mongoose");
const ArtsDynamicField = require("../../models/ArtsDynamicField");

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

exports.setFavoritesArtwork = async (userId, artworkId, action) => {
  const UserModel = require("../../models/User");
  const mongooseModule = require("mongoose");

  if (!mongooseModule.Types.ObjectId.isValid(artworkId)) {
    throw new Error("Invalid artworkId format");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (action === "add") {
    if (!user.favorites_art.includes(artworkId)) {
      user.favorites_art.push(artworkId);
    }
  } else if (action === "remove") {
    user.favorites_art = user.favorites_art.filter(
      (favId) => favId.toString() !== artworkId
    );
  } else {
    throw new Error("Invalid action specified");
  }

  await user.save();

  return {
    message: "Favorite updated successfully",
    favorites_art: user.favorites_art,
  };
};

// Artwork Catalog Management Functions
exports.createOrUpdateArtwork = async (artworkData) => {
  const DeletedArtwork = require("../../models/DeletedArts.js");
  const { _id, imageUrl, ...allFields } = artworkData;

  if (_id) {
    // Update existing artwork
    const updateData = { ...allFields };
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    const artwork = await ArtworkModel.findByIdAndUpdate(_id, updateData, {
      new: true,
    });

    if (!artwork) {
      throw new Error("Artwork not found");
    }

    return artwork;
  }

  // Create new artwork
  const artwork = new ArtworkModel({
    ...allFields,
    imageUrl,
    dateUploaded: new Date(),
  });

  await artwork.save();
  return artwork;
};

exports.getArtworkCatalogByIdentifier = async (identifier) => {
  let artwork;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    artwork = await ArtworkModel.findById(identifier);
  } else {
    artwork = await ArtworkModel.findOne({ filename: identifier });
  }

  if (!artwork) {
    throw new Error("Artwork not found");
  }

  return artwork;
};

exports.getAllArtworks = async () => {
  const artworks = await ArtworkModel.find({ deleted: { $ne: true } });
  return artworks;
};

exports.deleteArtwork = async (artworkId) => {
  const DeletedArtwork = require("../../models/DeletedArts.js");

  const artwork = await ArtworkModel.findById(artworkId);
  if (!artwork) {
    throw new Error("Artwork not found");
  }

  // Move to deleted collection
  const deletedArtwork = new DeletedArtwork({
    ...artwork.toObject(),
    deletedAt: new Date(),
  });
  await deletedArtwork.save();

  // Remove from active collection
  await ArtworkModel.findByIdAndDelete(artworkId);

  return { message: "Artwork deleted successfully" };
};

exports.getArtsDynamicFields = async () => {
  return await ArtsDynamicField.find({
    isActive: true,
  }).sort({
    displayOrder: 1,
  });
};

exports.getArtsDynamicFieldById = async (fieldId) => {
  const field =
    await ArtsDynamicField.findById(
      fieldId
    );

  if (!field) {
    throw new Error(
      "Dynamic field not found"
    );
  }

  return field;
};

exports.createArtsDynamicField = async (fieldData) => {
  const field =
    new ArtsDynamicField(fieldData);

  return await field.save();
};

exports.updateArtsDynamicField = async (fieldId, fieldData) => {
  const updatedField =
    await ArtsDynamicField.findByIdAndUpdate(
      fieldId,
      fieldData,
      {
        new: true,
        runValidators: true,
      }
    );

  if (!updatedField) {
    throw new Error(
      "Dynamic field not found"
    );
  }

  return updatedField;
};

exports.deactivateArtsDynamicField = async (fieldId) => {
  const field =
    await ArtsDynamicField.findByIdAndUpdate(
      fieldId,
      { isActive: false },
      { new: true }
    );

  if (!field) {
    throw new Error(
      "Dynamic field not found"
    );
  }

  return field;
};

exports.getArtsDynamicFieldsByTab = async () => {
  const fields =
    await ArtsDynamicField.find({
      isActive: true,
    }).sort({
      tabId: 1,
      displayOrder: 1,
    });

  return fields.reduce(
    (acc, field) => {
      const tabId =
        field.tabId || 0;

      if (!acc[tabId]) {
        acc[tabId] = [];
      }

      acc[tabId].push(field);

      return acc;
    },
    {}
  );
};
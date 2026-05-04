const PurchaseModel = require("../../models/Purchase");
const Purchase2Model = require("../../models/Purchase2");

exports.getUserPurchases = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return await PurchaseModel.find({ user_id: userId }).select("score_id");
};

exports.getUserArtworkPurchases = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return await Purchase2Model.find({ user_id: userId }).select("artwork_id");
};

exports.submitMusicRating = async (userId, scoreId, rating) => {
  const updated = await PurchaseModel.findOneAndUpdate(
    { score_id: scoreId, user_id: userId },
    { $set: { ratingGiven: rating } },
    { new: true }
  );

  if (!updated) {
    throw new Error("Purchase not found");
  }

  return updated;
};

exports.submitArtworkRating = async (userId, artworkId, rating) => {
  const updated = await Purchase2Model.findOneAndUpdate(
    { artwork_id: artworkId, user_id: userId },
    { $set: { ratingGiven: rating } },
    { new: true }
  );

  if (!updated) {
    throw new Error("Purchase not found");
  }

  return updated;
};
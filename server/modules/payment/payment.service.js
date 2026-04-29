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
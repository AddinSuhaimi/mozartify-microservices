const PurchaseModel = require("../../models/Purchase");
const Purchase2Model = require("../../models/Purchase2");
const mongoose = require("mongoose");
const stripe = require("../../config/stripe");
const CartModel = require("../../models/Cart");
const Cart2Model = require("../../models/Cart2");
const ABCFileModel = require("../../models/ABCFile");
const ArtworkModel = require("../../models/Artwork");

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

exports.createMusicCheckoutSession = async (userId, cartItems) => {
  const lineItems = cartItems.map((item) => ({
    price_data: {
      currency: "myr",
      product_data: {
        name: item.title,
      },
      unit_amount: Math.round(parseFloat(item.price) * 100),
    },
    quantity: 1,
  }));

  const frontendUrl =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_PROD_URL
      : process.env.FRONTEND_DEV_URL;

  const paymentSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    metadata: { type: "music" },
    success_url: `${frontendUrl}/success`,
    cancel_url: `${frontendUrl}/cancel`,
    client_reference_id: userId.toString(),
  });

  return paymentSession;
};

exports.createArtworkCheckoutSession = async (userId, cartItems) => {
  const lineItems = cartItems.map((item) => ({
    price_data: {
      currency: "myr",
      product_data: {
        name: item.title,
      },
      unit_amount: Math.round(parseFloat(item.price) * 100),
    },
    quantity: 1,
  }));

  const frontendUrl =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_PROD_URL
      : process.env.FRONTEND_DEV_URL;

  const paymentSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    metadata: { type: "artwork" },
    success_url: `${frontendUrl}/success-2`,
    cancel_url: `${frontendUrl}/cancel`,
    client_reference_id: userId.toString(),
  });

  return paymentSession;
};

exports.completePurchaseMusic = async (userId) => {
  const cart = await CartModel.findOne({ user_id: userId });

  if (!cart || cart.score_ids.length === 0) {
    throw new Error("Cart is empty");
  }

  const purchaseItems = await Promise.all(
    cart.score_ids.map(async (score_id) => {
      const musicScore = await ABCFileModel.findById(score_id);
      if (!musicScore) {
        throw new Error(`Music score with ID ${score_id} not found`);
      }

      return {
        user_id: userId,
        purchase_date: new Date(),
        price: parseFloat(musicScore.price),
        score_id: score_id,
      };
    })
  );

  // Insert purchase items
  await PurchaseModel.insertMany(purchaseItems);

  // Check for duplicates
  for (const item of purchaseItems) {
    const { user_id, score_id } = item;

    const duplicates = await PurchaseModel.find({
      user_id,
      score_id,
    });

    if (duplicates.length > 1) {
      const duplicateToDelete = duplicates[1];
      await PurchaseModel.deleteOne({ _id: duplicateToDelete._id });
    }
  }

  // Clear the cart
  await clearCart(
    CartModel,
    userId,
    "score_ids"
  );

  return { message: "Purchase completed successfully" };
};

exports.completePurchaseArtwork = async (userId) => {
  const cart = await Cart2Model.findOne({ user_id: userId });

  if (!cart || cart.artwork_ids.length === 0) {
    throw new Error("Cart is empty");
  }

  const purchaseItems = await Promise.all(
    cart.artwork_ids.map(async (artwork_id) => {
      const artwork = await ArtworkModel.findById(artwork_id);
      if (!artwork) {
        throw new Error(`Artwork with ID ${artwork_id} not found`);
      }

      return {
        user_id: userId,
        purchase_date: new Date(),
        price: parseFloat(artwork.price),
        artwork_id: artwork_id,
      };
    })
  );

  // Insert purchase items
  await Purchase2Model.insertMany(purchaseItems);

  // Check for duplicates
  for (const item of purchaseItems) {
    const { user_id, artwork_id } = item;

    const duplicates = await Purchase2Model.find({
      user_id,
      artwork_id,
    });

    if (duplicates.length > 1) {
      const duplicateToDelete = duplicates[1];
      await Purchase2Model.deleteOne({ _id: duplicateToDelete._id });
    }
  }

  // Clear the cart
  await clearCart(
    Cart2Model,
    userId,
    "artwork_ids"
  );

  return { message: "Purchase completed successfully" };
};

const clearCart = async (
  CartModel,
  userId,
  fieldName
) => {
  await CartModel.updateOne(
    { user_id: userId },
    {
      $set: {
        [fieldName]: [],
      },
    }
  );
};
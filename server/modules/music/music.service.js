const ABCFileModel = require("../../models/ABCFile");
const CartModel = require("../../models/Cart");

const buildMusicQuery = (combinedQueries, selectedCollection, queryText, filters) => {
  let conditions = [];

  // simple search
  if (queryText && queryText.trim() !== "") {
    conditions.push({
      $or: [
        { title: { $regex: queryText, $options: "i" } },
        { genre: { $regex: queryText, $options: "i" } },
        { composer: { $regex: queryText, $options: "i" } },
        { instrumentation: { $regex: queryText, $options: "i" } },
        { emotion: { $regex: queryText, $options: "i" } },
      ],
    });
  }

  // advanced search
  if (combinedQueries) {
    combinedQueries.forEach((row) => {
      if (!row.searchCategory || !row.searchText) return;

      let fieldMap = {
        Title: "title",
        Genre: "genre",
        Composer: "composer",
        Instrumentation: "instrumentation",
        Emotion: "emotion",
      };

      if (row.searchCategory === "All") {
        conditions.push({
          $or: Object.values(fieldMap).map((field) => ({
            [field]: { $regex: row.searchText, $options: "i" },
          })),
        });
      } else {
        const field = fieldMap[row.searchCategory];
        conditions.push({
          [field]: { $regex: row.searchText, $options: "i" },
        });
      }
    });
  }

  // filters
  if (filters) {
    const { genre, composer, instrumentation, emotion } = filters;

    if (genre) {
      conditions.push({ genre });
    }

    if (composer) {
      conditions.push({
        composer: { $regex: composer, $options: "i" },
      });
    }

    if (instrumentation) {
      conditions.push({
        instrumentation: { $regex: instrumentation, $options: "i" },
      });
    }

    if (emotion) {
      conditions.push({
        emotion: { $regex: emotion, $options: "i" },
      });
    }
  }

  if (selectedCollection && selectedCollection !== "All") {
    conditions.push({ collection: selectedCollection });
  }

  if (conditions.length === 1) return conditions[0];
  if (conditions.length > 1) return { $and: conditions };

  return {};
};

exports.getMusicRefineSearch = async () => {
  const composers = await ABCFileModel.distinct("composer");
  const genres = await ABCFileModel.distinct("genre");
  const emotions = await ABCFileModel.distinct("emotion");
  const instrumentation = await ABCFileModel.distinct("instrumentation");

  return { composers, genres, emotions, instrumentation };
};

exports.searchMusic = async (body) => {
  const { combinedQueries, selectedCollection, query: queryText, filters } = body;

  const mongoQuery = buildMusicQuery(
    combinedQueries,
    selectedCollection,
    queryText,
    filters
  );

  return await ABCFileModel.find(mongoQuery);
};

exports.checkPurchase = async ({ score_id, user_id }) => {
  if (!score_id || !user_id) {
    throw new Error("Missing score_id or user_id");
  }

  const PurchaseModel = require("../../models/Purchase");
  const purchases = await PurchaseModel.find({ score_id, user_id });

  if (purchases.length > 0) {
    return { exists: true, data: purchases };
  } else {
    return { exists: false, data: [] };
  }
};

exports.getUserMusicCart = async (userId) => {
  const cart = await CartModel.findOne({ user_id: userId });

  if (!cart || cart.score_ids.length === 0) {
    return [];
  }

  return cart.score_ids.map((scoreId) => ({
    score_id: scoreId,
  }));
};
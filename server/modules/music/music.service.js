const ABCFileModel = require("../../models/ABCFile");

const buildMusicQuery = (combinedQueries, selectedCollection, queryText) => {
  let query = {};
  let conditions = [];

  // simple search
  if (queryText) {
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
  const { combinedQueries, selectedCollection, query: queryText } = body;

  const mongoQuery = buildMusicQuery(
    combinedQueries,
    selectedCollection,
    queryText
  );

  return await ABCFileModel.find(mongoQuery);
};
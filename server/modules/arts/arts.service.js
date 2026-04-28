const ArtworkModel = require("../../models/Artwork");

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
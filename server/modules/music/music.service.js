const ABCFileModel = require("../../models/ABCFile");

exports.getMusicRefineSearch = async () => {
  const composers = await ABCFileModel.distinct("composer");
  const genres = await ABCFileModel.distinct("genre");
  const emotions = await ABCFileModel.distinct("emotion");
  const instrumentation = await ABCFileModel.distinct("instrumentation");

  return { composers, genres, emotions, instrumentation };
};

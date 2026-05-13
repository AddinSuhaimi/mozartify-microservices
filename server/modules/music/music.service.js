const ABCFileModel = require("../../models/ABCFile");
const DeletedABCFile = require("../../models/deletedABCFile");
const CartModel = require("../../models/Cart");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const mongoose = require("mongoose");

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

exports.getMusicScoreById = async (scoreId) => {
  const musicScore = await ABCFileModel.findById(scoreId);

  if (!musicScore) {
    throw new Error("Music score not found");
  }

  return musicScore;
};

exports.getMusicScoresByIds = async (scoreIds) => {
  if (!scoreIds || scoreIds.length === 0) {
    throw new Error("No score IDs provided");
  }

  const musicScores = await ABCFileModel.find({
    _id: { $in: scoreIds },
  });

  if (musicScores.length === 0) {
    throw new Error("No music scores found");
  }

  return musicScores;
};

exports.getPopularMusicScores = async () => {
  const popularScores = await ABCFileModel.find()
    .sort({ downloads: -1 })
    .limit(10);

  return popularScores;
};

exports.getUserLikedMusicScores = async (userId) => {
  const UserModel = require("../../models/User");
  const user = await UserModel.findById(userId);

  if (!user || !user.favorites_music || user.favorites_music.length === 0) {
    throw new Error("No liked scores found");
  }

  const likedScores = await ABCFileModel.find({
    _id: { $in: user.favorites_music },
  });

  return likedScores;
};

exports.addToCart = async (userId, musicScoreId) => {
  let cart = await CartModel.findOne({ user_id: userId });

  if (!cart) {
    cart = new CartModel({
      user_id: userId,
      score_ids: [musicScoreId],
    });
  } else {
    // safer comparison for ObjectId vs string
    if (!cart.score_ids.some(id => id.toString() === musicScoreId)) {
      cart.score_ids.push(musicScoreId);
    }
  }

  await cart.save();
};

exports.removeFromCart = async (userId, scoreId) => {
  const cart = await CartModel.findOneAndUpdate(
    { user_id: userId },
    { $pull: { score_ids: scoreId } },
    { new: true }
  );

  if (!cart) {
    throw new Error("Cart not found");
  }

  return cart;
};

exports.setFavoritesMusic = async (userId, musicScoreId, action) => {
  const UserModel = require("../../models/User");
  const mongoose = require("mongoose");

  if (!mongoose.Types.ObjectId.isValid(musicScoreId)) {
    throw new Error("Invalid musicScoreId format");
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (action === "add") {
    if (!user.favorites_music.includes(musicScoreId)) {
      user.favorites_music.push(musicScoreId);
    }
  } else if (action === "remove") {
    user.favorites_music = user.favorites_music.filter(
      (favId) => favId.toString() !== musicScoreId
    );
  } else {
    throw new Error("Invalid action specified");
  }

  await user.save();

  return {
    message: "Favorite updated successfully",
    favorites_music: user.favorites_music,
  };
};

exports.processMusicUpload = async (file) => {
  const inputFilePath = path.join(
    __dirname,
    "../../uploads",
    file.filename
  );

  const outputDir = path.join(
    __dirname,
    "../../uploads",
    `${path.parse(file.filename).name}`
  );

  const mxlFilePath = path.join(
    outputDir,
    `${path.parse(file.filename).name}.mxl`
  );

  const abcFilePath = path.join(
    outputDir,
    `${path.parse(file.filename).name}.abc`
  );

  await fs.promises.mkdir(outputDir, {
    recursive: true,
  });

  console.log(
    `Running Audiveris on file: ${inputFilePath}`
  );

  const audiverisCommand = `audiveris -batch -transcribe -export -output "${outputDir}" "${inputFilePath}"`;

  await execPromise(audiverisCommand);

  const xml2abcPath = path.resolve(
    __dirname,
    "../../node_modules/.bin/xml2abc"
  );

  const xml2abcCommand = `"${xml2abcPath}" -o "${outputDir}" "${mxlFilePath}"`;

  await execPromise(xml2abcCommand);

  const data =
    await fs.promises.readFile(
      abcFilePath,
      "utf8"
    );

  const abcFile = new ABCFileModel({
    filename: file.filename,
    content: data,
  });

  await abcFile.save();

  return {
    filePath: `/uploads/${file.filename}`,

    mxlFilePath: `/uploads/${
      path.parse(file.filename).name
    }/${
      path.parse(file.filename).name
    }.mxl`,

    abcFilePath: `/uploads/${
      path.parse(file.filename).name
    }/${
      path.parse(file.filename).name
    }.abc`,

    message:
      "File uploaded and processed successfully",
  };
};

const execPromise = (command) => {
  return new Promise(
    (resolve, reject) => {
      exec(
        command,
        (error, stdout, stderr) => {
          if (error) { return reject(error); }
          resolve(stdout);
        }
      );
    }
  );
};

// ABC File Management Functions
exports.getABCFiles = async (sortOrder = "desc", sortBy = "_id") => {
  const mongoSortOrder = sortOrder === "asc" ? 1 : -1;

  const abcFiles = await ABCFileModel.find({ deleted: false }).sort({
    [sortBy]: mongoSortOrder,
  });

  return abcFiles;
};

exports.getABCFileByIdentifier = async (identifier) => {
  let abcFile;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    abcFile = await ABCFileModel.findById(identifier);
  } else {
    abcFile = await ABCFileModel.findOne({ filename: identifier });
  }

  if (!abcFile) {
    throw new Error("File not found");
  }

  return abcFile;
};

exports.updateABCFileContent = async (filename, content) => {
  const abcFile = await ABCFileModel.findOneAndUpdate(
    { filename },
    { content },
    { new: true }
  );

  if (!abcFile) {
    throw new Error("File not found");
  }

  return abcFile;
};

exports.getCatalogByFilename = async (filename) => {
  const catalogData = await ABCFileModel.findOne({ filename });

  if (!catalogData) {
    throw new Error("File not found");
  }

  return catalogData;
};

exports.saveCatalogMetadata = async (filename, metadata) => {
  if (!filename) {
    throw new Error("Filename is required");
  }

  const abcFile = await ABCFileModel.findOneAndUpdate(
    { filename },
    metadata,
    { new: true, strict: false }
  );

  if (!abcFile) {
    throw new Error("File not found");
  }

  return abcFile;
};

exports.deleteAndTransferABCFile = async (filename) => {
  // Find the original file
  const originalFile = await ABCFileModel.findOne({ filename });

  if (!originalFile) {
    throw new Error("File not found");
  }

  // Create a new document in the DeletedABCFile collection
  const deletedFile = new DeletedABCFile({
    ...originalFile.toObject(),
    dateUploaded: originalFile.dateUploaded || new Date(),
    deleted: true,
    downloads: originalFile.downloads || 0,
    downloadEvents: originalFile.downloadEvents || [],
  });

  // Save the file to the deleted collection
  await deletedFile.save();

  // Remove the original document
  await ABCFileModel.findOneAndDelete({ filename });

  return deletedFile;
};
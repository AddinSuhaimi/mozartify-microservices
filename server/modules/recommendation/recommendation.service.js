const UserModel = require("../../models/User");
const ABCFileModel = require("../../models/ABCFile");
const ArtworkModel = require("../../models/Artwork");

/* change to this when migrating to microservices:
await axios.get("user-service/user/" + userId)
await axios.get("music-service/music")
creates dependency chain:
recommendation-service
   ↓
user-service
   ↓
music-service
   ↓
art-service
*/

exports.getMusicRecommendations = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  const allScores = await ABCFileModel.find({});

  const scored = allScores.map((music) => {
    let score = 0;
    let matchCount = 0;

    if (user.composer_preferences.includes(music.composer)) {
      score += 0.4;
      matchCount++;
    }

    if (user.genre_preferences.includes(music.genre)) {
      score += 0.35;
      matchCount++;
    }

    if (user.emotion_preferences.includes(music.emotion)) {
      score += 0.25;
      matchCount++;
    }

    if (matchCount > 1) score += 0.1 * matchCount;

    if (user.favorites_music.includes(music._id)) {
      score = 0;
    }

    return { score, data: music };
  });

console.log("Top music scores:", scored .filter(s => s.score > 0) .slice(0, 5) .map(s => ({ composer: s.data.composer, genre: s.data.genre, emotion: s.data.emotion , score: s.score })) );

  const recommendations = await finalizeRecommendations(
    scored,
    user.favorites_music,
    ABCFileModel,
    "genre"
  );

  return recommendations;
};

exports.getArtworkRecommendations = async (userId) => {
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("User not found");

  const allArtworks = await ArtworkModel.find({});

  const scored = allArtworks.map((art) => {
    let score = 0;
    let matchCount = 0;

    if (user.collection_preferences.includes(art.collection)) {
      score += 0.4;
      matchCount++;
    }

    if (user.artist_preferences.includes(art.artist)) {
      score += 0.35;
      matchCount++;
    }

    if (matchCount > 1) score += 0.1 * matchCount;

    if (user.favorites_art.includes(art._id)) {
      score = 0;
    }

    return { score, data: art };
  });

  console.log("Top artwork scores:", scored .filter(s => s.score > 0) .slice(0, 5) .map(s => ({ collection: s.data.collection, artist: s.data.artist, score: s.score })) );

  const recommendations = await finalizeRecommendations(
    scored,
    user.favorites_art,
    ArtworkModel,
    "collection"
  );

  return recommendations;
};

// helper method for duplicated logic in both recommendation types
// sort -> filter -> genre diversity -> fill with popular if <10 results
const finalizeRecommendations = async (scored, favorites, Model, diversityField) => {
  const sorted = scored
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .map((item) => item.data);

  const recommendations = [];
  const used = new Set();

  let i = 0;
  while (recommendations.length < 10 && i < sorted.length) {
    const item = sorted[i];
    const value = item[diversityField]; // 👈 dynamic field

    if (!used.has(value) || used.size >= 5) {
      recommendations.push(item);
      used.add(value);
    }

    i++;
  }

  if (recommendations.length < 10) {
    const popular = await Model.find({
      _id: { $nin: [...recommendations.map(r => r._id), ...favorites] }
    })
      .sort({ downloads: -1 })
      .limit(10 - recommendations.length);

    recommendations.push(...popular);
  }

  return recommendations;
};
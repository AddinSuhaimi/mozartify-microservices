const axios = require("axios");
const { fastApiEndpoints } = require("./ai.constants");

// Emotion prediction
exports.predictEmotion = async (fileUrl) => {
  const response = await axios.post(
    fastApiEndpoints.emotion,
    { fileUrl }
  );

  return response.data;
};

// Gender prediction
exports.predictGender = async (fileUrl) => {
  const response = await axios.post(
    fastApiEndpoints.gender,
    { fileUrl }
  );

  return {
    gender: response.data.gender,
  };
};

// Genre prediction
exports.predictGenre = async (fileUrl) => {
  const response = await axios.post(
    fastApiEndpoints.genre,
    { fileUrl }
  );

  return {
    genre: response.data.genre,
  };
};

// Instrument prediction
// exports.predictInstrument = async (fileUrl) => {
//   const response = await axios.post(
//     fastApiEndpoints.instrument,
//     { fileUrl }
//   );

//   return {
//     instrumentation: response.data.top_instruments,
//   };
// };
const axios = require("axios");
const { fastApiEndpoints } = require("./ai.constants");

const AI_REQUEST_TIMEOUT = 120000;

// Emotion prediction
exports.predictEmotion = async (fileUrl) => {
  const response = await axios.post(
    fastApiEndpoints.emotion,
    { fileUrl },
    { timeout: AI_REQUEST_TIMEOUT }
  );

  return response.data;
};

// Gender prediction
exports.predictGender = async (fileUrl) => {
  const response = await axios.post(
    fastApiEndpoints.gender,
    { fileUrl },
    { timeout: AI_REQUEST_TIMEOUT }
  );

  return {
    gender: response.data.gender,
  };
};

// Genre prediction
exports.predictGenre = async (fileUrl) => {
  const response = await axios.post(
    fastApiEndpoints.genre,
    { fileUrl },
    { timeout: AI_REQUEST_TIMEOUT }
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
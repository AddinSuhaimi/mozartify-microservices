const isProduction = process.env.NODE_ENV === "production";

const FASTAPI_BASE_URL = isProduction
  ? process.env.FASTAPI_PROD_URL // Base URL for production
  : process.env.FASTAPI_DEV_URL;

const fastApiEndpoints = {
  emotion:
    process.env.FASTAPI_EMOTION_URL ||
    `${FASTAPI_BASE_URL}:8002/predict-emotion`,
  gender:
    process.env.FASTAPI_GENDER_URL ||
    `${FASTAPI_BASE_URL}:8003/predict-gender`,
  genre:
    process.env.FASTAPI_GENRE_URL ||
    `${FASTAPI_BASE_URL}:8001/predict-genre`,
};

module.exports = {
  fastApiEndpoints,
};

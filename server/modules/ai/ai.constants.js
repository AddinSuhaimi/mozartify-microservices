const isProduction = process.env.NODE_ENV === "production";

const FASTAPI_BASE_URL = isProduction
  ? process.env.FASTAPI_PROD_URL // Base URL for production
  : process.env.FASTAPI_DEV_URL;

const fastApiEndpoints = {
  emotion: `${FASTAPI_BASE_URL}:8002/predict-emotion`,
  gender: `${FASTAPI_BASE_URL}:8003/predict-gender`,
  genre: `${FASTAPI_BASE_URL}:8001/predict-genre`,
  instrument: `${FASTAPI_BASE_URL}:8000/predict-instrument`,
};

module.exports = {
  fastApiEndpoints,
};

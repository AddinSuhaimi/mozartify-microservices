const aiService = require("./ai.service");

// Emotion prediction
exports.predictEmotion = async (req, res) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    return res.status(400).send("No file URL provided.");
  }

  try {
    const result = await aiService.predictEmotion(fileUrl);
    res.json(result);
  } catch (error) {
    console.error("Error predicting emotion:", error);
    res.status(500).send("Error predicting emotion");
  }
};

// Gender prediction
exports.predictGender = async (req, res) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    return res.status(400).send("No file URL provided.");
  }

  try {
    const result = await aiService.predictGender(fileUrl);
    res.json(result);
  } catch (error) {
    console.error("Error predicting gender:", error);
    res.status(500).send("Error predicting gender");
  }
};

// Genre prediction
exports.predictGenre = async (req, res) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    return res.status(400).send("No file URL provided.");
  }

  try {
    const result = await aiService.predictGenre(fileUrl);
    res.json(result);
  } catch (error) {
    console.error("Error predicting genre:", error);
    res.status(500).send("Error predicting genre");
  }
};

// Instrument prediction
// exports.predictInstrument = async (req, res) => {
//   const { fileUrl } = req.body;

//   if (!fileUrl) {
//     return res.status(400).json({
//       message: "No file URL provided.",
//     });
//   }

//   try {
//     const result = await aiService.predictInstrument(fileUrl);
//     res.json(result);
//   } catch (error) {
//     console.error("Error predicting instrument:", error);

//     res.status(500).json({
//       message: "Error predicting instrument",
//       error: error.message,
//     });
//   }
// };
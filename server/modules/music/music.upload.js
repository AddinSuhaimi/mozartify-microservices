const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadPath = path.join(
  __dirname,
  "../../uploads"
);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const acceptedFileTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (
      acceptedFileTypes.includes(
        file.mimetype
      )
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, JPG, and PDF files are allowed."
        )
      );
    }
  },
});

module.exports = upload;
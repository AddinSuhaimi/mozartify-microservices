const bucket = require("../../config/firebaseAdmin");

exports.uploadFileToFirebase = async (
  file,
  folder = "general"
) => {

  return new Promise((resolve, reject) => {

    const filename =
      `${Date.now()}-${file.originalname}`;

    const blob = bucket.file(
      `${folder}/${filename}`
    );

    const blobStream =
      blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

    blobStream.on("error", (err) => {
      reject(err);
    });

    blobStream.on("finish", async () => {

      await blob.makePublic();

      const fileUrl =
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      resolve(fileUrl);
    });

    blobStream.end(file.buffer);
  });
};
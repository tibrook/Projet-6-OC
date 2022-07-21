const multer = require("multer");

const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/* Contient la logique nécessaire pour indiquer à multer où enregistrer les fichiers entrants  */
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_").split(".");
    name.pop();
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + "." + extension);
  },
});
//exportation de multer en ne gérant que le téléchargement de fichiers image
module.exports = multer({ storage: storage }).single("image");

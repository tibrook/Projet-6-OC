const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const stuffCtrl = require("../controllers/stuff");

router.get("/", auth, stuffCtrl.getAllStuff);
router.post("/", auth, multer, stuffCtrl.createSauce);
router.get("/:id", auth, stuffCtrl.getOneSauce);
router.put("/:id", auth, multer, stuffCtrl.modifySauce);
router.delete("/:id", auth, stuffCtrl.deleteSauce);
router.post("/:id/like", auth, stuffCtrl.addLike);

module.exports = router;

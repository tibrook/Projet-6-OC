const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

/* Utilisation de la methode schema de mongoose */
const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

/* Verification que 2 utilisateurs n'ont pas la meme adresse email*/
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);

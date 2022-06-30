const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/user");
//const Thing = require('./models/thing');
const app = express();
mongoose
  .connect(
    "mongodb+srv://guillou:0508@ocp6.euv7huo.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});
app.post("/api/auth/signup", (req, res, next) => {
  const user = new User({
    ...req.body, // L'opérateur spread est utilisé pour faire une copie de toutes les infos de req.body
  });

  User.findOne({ email: req.body.email }).then((userfound) => {
    console.log(user);
    if (userfound !== null) {
      console.log("L'utilisateur est déjà enregistré");
      return res.status(201).json({ message: "User déjà enregistré !" });
    } else {
      user
        .save()
        .then(() => res.status(201).json({ message: "User enregistré !" }))
        .catch((error) => res.status(400).json({ error }));
      console.log("Enregistrement de l'utilisateur");
      return;
    }
  });
});
module.exports = app;
/* if (user !== null) {
  alert("Cette adresse mail est déjà enregistrée");
  return "Cette adresse mail est déjà enregistrée";
} */

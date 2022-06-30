const express = require("express");
const mongoose = require("mongoose");
<<<<<<< HEAD
const bodyParser = require("body-parser");
const userRoutes = require("./routes/user");

=======
const User = require("./models/user");
//const Thing = require('./models/thing');
const app = express();
>>>>>>> f80a7f7ea162db063664546b5f80f5562fab758f
mongoose
  .connect(
    "mongodb+srv://guillou:0508@ocp6.euv7huo.mongodb.net/?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

const app = express();

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

app.use(bodyParser.json());
app.use("/api/auth", userRoutes);
module.exports = app;

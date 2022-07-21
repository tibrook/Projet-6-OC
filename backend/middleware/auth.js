const jwt = require("jsonwebtoken");
require("dotenv").config();
module.exports = (req, res, next) => {
  if (req.headers.authorization === undefined) {
    res.status(401).json({ error: "token d'identification nécessaire" });
  }
  else {
    try {
      // On récupère le token du header
      const token = req.headers.authorization.split(" ")[1];
      // On utilise la fonction verify pour décoder notre token
      const decodedToken = jwt.verify(token, process.env.secret_token);
      //On extrait l'id et on l'ajoute à notre fonction request
      const userId = decodedToken.userId;
      req.auth = {
        userId: userId,
      };
      next();
    } catch (error) {
      res.status(403).json({ error: error });
    }
  }

};

const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // On récupère le token du header
    const token = req.headers.authorization.split(" ")[1];
    // On utilise la fonction verify pour décoder notre token
    const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET");
    //On extrait l'id et on l'ajoute à notre fonction request
    const userId = decodedToken.userId;
    req.auth = {
      userId: userId,
    };
    next();
  } catch (error) {
    res.status(403).json({ error });
  }
};

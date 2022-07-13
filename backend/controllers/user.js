const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* Création de compte */
exports.signup = (req, res, next) => {
  if (
    checkEmail(req.body.email) != null &&
    checkMdp(req.body.password) != null
  ) {
    bcrypt
      .hash(req.body.password, 10)
      .then((hash) => {
        const user = new User({
          email: req.body.email,
          password: hash,
        });
        user
          .save()
          .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
          .catch((error) => res.status(400).json({ error }));
      })
      .catch((error) => res.status(500).json({ error }));
  } else {
    res.status(500).json({ message: "email ou mdp au mauvais format" });
  }
};

/* Login */
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
              //Méthode de jwt permettant de chiffrer un nouveau token qui contient l'ID user
              expiresIn: "24h", //Chiffré avec la chaine passée en paramètre
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

const checkEmail = (email) => {
  if (email.length > 0 && (email.length < 7 || email.trim() == "")) {
    console.log("Le mail doit faire au moins 7 caractères");
    return null;
  } else if (!email.match(/^[\w_/.-]+@[\w-]+\.[a-z]{2,4}$/i)) {
    console.log("ne correspond pas a la regex");
    return null;
  } else {
    return email;
  }
};
const checkMdp = (mdp) => {
  if (
    // (?=.*[a-z]) = at least 1 lowercase character
    // (?=.*[A-Z]) = at least 1 uppercase character
    // (?=.*[0-9]) at least 1 numeric character
    // (?=.*[!@#$%^&*]) must contain one special character
    // (?=.{8,}) length must be eight or longer
    !mdp.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/)
  ) {
    return null;
  } else {
    return mdp;
  }
};

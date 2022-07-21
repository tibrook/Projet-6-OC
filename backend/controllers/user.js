const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/* Création de compte */
exports.signup = (req, res, next) => {
  /* Vérification format  email */
  if (
    checkEmail(req.body.email) == null) {
    res.status(400).json({ error: "L'email doit être du format suivant : toto@gmail.com" });
    /* Verification format mdp  */
  } else if (checkMdp(req.body.password) == null) {
    console.log("yes");
    res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères, dont au moins 1 chiffre, 1 lettre majuscule et un caractère spécial" });
  } else {
    /* chiffrement et salage du mdp suur 10 tours */
    bcrypt
      .hash(req.body.password, 10)
      .then((hash) => {
        const user = new User({
          email: req.body.email,
          password: hash,
        });

        /* Sauvegarde du user dans la bdd  */
        user
          .save()
          .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
          .catch((error) => res.status(400).json({ error }));
      })
      .catch((error) => res.status(500).json({ error }));
  }
};

/* Login */
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      /* Verification email */
      if (!user) {
        return res.status(401).json({ error: "Données incorrectes" });
      }
      /* Vérification du mot de passe en comparant le mot de passe envoyé par l'utilisateur  & le mdp du user */
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Données incorrectes" });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, process.env.secret_token, {
              //Méthode de jwt permettant de chiffrer un nouveau token qui contient l'ID user
              expiresIn: "24h", //Chiffré avec la chaine passée en paramètre
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
/* Vérification format email */
const checkEmail = (email) => {
  if (email.length > 0 && (email.length < 7 || email.trim() == "")) {
    console.log("Le mail doit faire au moins 7 caractères");
    return null;
  } else if (!email.match(/^[\w_/.-]+@[\w-]+\.[a-z]{2,4}$/i)) {
    console.log("Mauvais format");
    return null;
  } else {
    return email;
  }
};
/* Vérification format mot de passe  */
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

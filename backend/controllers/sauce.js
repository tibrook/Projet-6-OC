const Sauce = require("../models/sauce");
const fs = require("fs");

/* Create Sauce  */
exports.createSauce = (req, res, next) => {
  if (fieldChecker(req)) {
    // le type doit être en form-data et non en JSON
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    //On remplacera le userID en bdd avec le middleware d'authentification
    delete sauceObject._userId;
    /* Vérification du fichier joint */
    if (!req.file || !extChecker(req)) {
      res.status(400).json({ error: "Mauvaise extension" });
      return;
    }
    /* Verification du heat */
    if (!heatChecker(sauceObject.heat)) {
      res
        .status(400)
        .json({ error: "Le heat doit être compris entre 1 et 10" });
      return;
    }
    /* Création de notre objet Sauce */
    const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
      likes: 0,
      dislikes: 0,
      usersLiked: [],
      usersDisliked: [],
    });

    sauce
      .save()
      .then(() => {
        res.status(201).json({ message: "Objet enregistré !" });
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  } else {
    res.status(400).json({ error });
  }
};

/* Find One Sauce */
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? /* Si oui, on traite la nouvelle image */
      {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : /* Si non, on traite l'objet entrant */
      { ...req.body };
  delete sauceObject._userId;
  /* On verifie qu'il n'y ait pas de caractères spéciaux  */
  if (!fieldChecker(req)) {
    res.status(400).json({ error: "Format des données non valide" });
    return;
  } else {
    /* Verifiation de l'extension du fichier s'il y en a un  */
    if (req.file && !extChecker(req)) {
      res.status(400).json({ error: "extension non valide" });
      return;
    }
    /* Verification du heat */
    if (!heatChecker(sauceObject.heat)) {
      res
        .status(400)
        .json({ error: "Le heat doit être compris entre 1 et 10" });
      return;
    }
    /* Modification de la sauce */
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        /* Puis on vérifie que le requérant est bien propriétaire de l'objet */
        if (sauce.userId != req.auth.userId) {
          res.status(403).json({ error: "unauthorized request" });
        } else {
          Sauce.updateOne(
            { _id: req.params.id },
            { ...sauceObject, _id: req.params.id }
          )
            .then(() => res.status(200).json({ message: "Objet modifié!" }))
            .catch((error) => res.status(401).json({ error }));
        }
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  }
};

/* Delete Sauce */
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ error: "Not authorized" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

/* Get all Sauces */
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

/* AddLike /Dislike */
exports.addLike = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      /* On vérifie si l'utilisateur a déjà like/dislike la sauce*/
      const userFoundLike = sauce.usersLiked.find(
        (user) => user == req.auth.userId
      );
      const userFoundDislike = sauce.usersDisliked.find(
        (user) => user == req.auth.userId
      );
      /* S'il like */
      if (req.body.like === 1) {
        if (userFoundLike) {
        } else if (userFoundDislike) {
          supprArrayLike(sauce, req.auth.userId, "usersDisliked");
          sauce.usersLiked.push(req.auth.userId);
        } else {
          sauce.usersLiked.push(req.auth.userId);
        }
        /* S'il unlike */
      } else if (req.body.like === 0) {
        if (userFoundLike) {
          supprArrayLike(sauce, req.auth.userId, "usersLiked");
        } else if (userFoundDislike) {
          supprArrayLike(sauce, req.auth.userId, "usersDisliked");
        }
        /* S'il dislike */
      } else if (req.body.like === -1) {
        if (userFoundDislike) {
        } else if (userFoundLike) {
          supprArrayLike(sauce, req.auth.userId, "usersLiked");
          sauce.usersDisliked.push(req.auth.userId);
        } else {
          sauce.usersDisliked.push(req.auth.userId);
        }
      } else {
        res.status(400).json({
          error: "Mauvais format",
        });
        return;
      }
      sauce.likes = sauce.usersLiked.length;
      sauce.dislikes = sauce.usersDisliked.length;

      Sauce.updateOne({ _id: req.params.id }, sauce)
        .then(() => {
          res.status(201).json({
            message: "Sauce updated successfully!",
          });
        })
        .catch((error) => {
          res.status(400).json({
            error: error,
          });
        });
    })
    .catch((error) => res.status(401).json({ error }));
};

/* Suppression d'un userID des tableaux likes/dislikes */
const supprArrayLike = (sauce, idUser, tableLikeDislike) => {
  let arrayLength;
  if (tableLikeDislike == "usersLiked") {
    arrayLength = sauce.usersLiked.length;
  } else {
    arrayLength = sauce.usersDisliked.length;
  }
  /* On peut aussi utiliser findIndex() */
  for (let i = 0; i < arrayLength; i++) {
    if (tableLikeDislike == "usersLiked") {
      if (sauce.usersLiked[i] == idUser) {
        sauce.usersLiked.splice(i, 1);
      }
    } else {
      if (sauce.usersDisliked[i] == idUser) {
        sauce.usersDisliked.splice(i, 1);
      }
    }
  }
};

// On vérifie qu'il n'y ait pas de caractères spéciaux
const fieldChecker = (req) => {
  let sauceObject;
  if (req.body.sauce) {
    sauceObject = JSON.parse(req.body.sauce);
  } else {
    sauceObject = req.body;
  }
  if (
    !sauceObject.manufacturer.match(/^[a-zA-Z-éÉèç ]*$/) ||
    !sauceObject.name.match(/^[a-zA-Z-éÉèç ]*$/) ||
    !sauceObject.description.match(/^[a-zA-Z-éÉèç ]*$/) ||
    !sauceObject.mainPepper.match(/^[a-zA-Z-éÉèç ]*$/)
  ) {
    return null;
  } else {
    return 1;
  }
};

// Le heat doit être compris entre 1 et 10
const heatChecker = (heat) => {
  if (heat < 0 || heat > 10 || Number.isInteger(heat) != true) {
    return null;
  } else {
    return 1;
  }
};

// Vérification de l'extension du fichier.
const extChecker = (image) => {
  if (image.file.length == 0) {
    return null;
  }
  const ext = image.file.originalname.substring(
    image.file.originalname.lastIndexOf(".") + 1
  );
  if (ext != "jpg" && ext != "jpeg" && ext != "png") {
    return null;
  } else {
    return 1;
  }
};
const Sauce = require("../models/sauce");
const fs = require("fs");

/* Create Sauce  */
exports.createSauce = (req, res, next) => {
  if (!req.body.sauce || !req.file) {
    res.status(400).json({ error: "Format des données incorrect" });
    return;
  }
  // Verification des données envoyées
  if (fieldChecker(req)) {
    // le type doit être en form-data et non en JSON
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    //On remplacera le userID en bdd avec le middleware d'authentification
    delete sauceObject.userId;

    /* Vérification du fichier joint */
    if (!req.file || !extChecker(req)) {
      res.status(422).json({ error: "Mauvaise extension" });
      supprImage(req)
      return;
    }
    /* Verification du heat */
    if (!heatChecker(sauceObject.heat)) {
      res
        .status(422)
        .json({ error: "Le heat doit être compris entre 1 et 10" });
      supprImage(req)
      return;
    }
    /* Création de notre objet Sauce */
    const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename
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
        res.status(500).json({ error });
      });
  } else {
    supprImage(req)
    res.status(422).json({ error: "Les caractères spéciaux ne sont pas acceptés." });
    return
  }
};

/* Find One Sauce */
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      if (!sauce) {
        res.status(404).json({
          error: "id non valide",
        });
      } else {
        res.status(200).json(sauce);
      }
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};
/* Modification sauce */
exports.modifySauce = (req, res, next) => {

  /* On vérifie qu'il y ait bien des données envoyées  */
  if (
    (req.file && !req.body.sauce) ||
    (!req.file && req.body.sauce) ||
    (!req.file && !req.body)
  ) {
    res.status(400).json({ error: "Format des données non valide" });
    return;
  }

  const sauceObject = req.file
    ? /* Si oui, on traite la nouvelle image */
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename
        }`,
    }
    : /* Si non, on traite l'objet entrant */
    { ...req.body };
  delete sauceObject.userId;

  /* On verifie qu'il n'y ait pas de caractères spéciaux  */
  if (!fieldChecker(req)) {
    res.status(400).json({ error: "Format des données non valide. Caractères spéciaux non autorisés" });
    supprImage(req)
    return;
  } else {
    /* Verifiation de l'extension du fichier s'il y en a un  */
    if (req.file && !extChecker(req)) {
      res.status(400).json({ error: "extension non valide" });
      supprImage(req)
      return;
    }
    /* Verification du heat */
    if (!heatChecker(sauceObject.heat)) {
      res
        .status(400)
        .json({ error: "Le heat doit être compris entre 1 et 10" });
      supprImage(req)
      return;
    }
    /* Modification de la sauce */
    Sauce.findOne({ _id: req.params.id })
      .then((sauce) => {
        if (!sauce) {
          res.status(400).json({ error: "ID non valide" });
          supprImage(req)
          return
        }
        /* Puis on vérifie que le requérant est bien propriétaire de l'objet */
        if (sauce.userId != req.auth.userId) {
          res.status(403).json({ error: "unauthorized request" });
        } else {
          Sauce.updateOne(
            { _id: req.params.id },
            { ...sauceObject, _id: req.params.id }
          )
            .then(() => {
              /* Si une image est jointe, on supprime l'ancienne image */
              //    fs.unlink(sauce.imageUrl, (error) => { console.log(error); })
              if (req.file) {
                supprImage(sauce)
              }

              res.status(200).json({ message: "Objet modifié!" })
            })
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
              res.status(204).json();
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(400).json({ error: "id non valide" });
    });
};

/* Get all Sauces */
exports.getAllSauces = (req, res, next) => {
  console.log(req.auth);
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
      if (!sauce) {
        res.status(403).json({
          error: "id non valide",
        });
        return
      }
      if (req.body.userId != req.auth.userId) {
        res.status(401).json({
          error: "Unauthorize request",
        });
        return
      }
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
          res.status(200).json({
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
  let sauceFields;
  if (req.body.sauce) {
    sauceFields = JSON.parse(req.body.sauce);
  } else {
    sauceFields = req.body;
  }
  if (
    sauceFields.name.trim() == "" ||
    sauceFields.manufacturer.trim() == "" ||
    sauceFields.description.trim() == "" ||
    sauceFields.mainPepper.trim() == "" ||
    !sauceFields.manufacturer.match(/^[a-zA-Z-éÉèç ]*$/) ||
    !sauceFields.name.match(/^[a-zA-Z-éÉèç ]*$/) ||
    !sauceFields.description.match(/^[a-zA-Z1-9-éÉèç ]*$/) ||
    !sauceFields.mainPepper.match(/^[a-zA-Z-éÉèç ]*$/)
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
/* Suppression d'une image en cas de modification / erreur  */
const supprImage = (req) => {
  if (req.file) {
    // Dans le cas d'une image déjà déjà transformée par multer, on récupère directement le nom
    const filename = req.file.filename.split("/images/")[1] || req.file.filename;
    fs.unlink(`images/${filename}`, (error) => {
      if (error) {
        return null;
      }
    })
    //Dans le cas d'une modification d'image, on supprimer l'ancienne image (sauce.imageUrl)
  } else if (req.imageUrl) {
    const filename = req.imageUrl.split("/images/")[1];
    console.log(req.imageUrl);
    fs.unlink(`images/${filename}`, (error) => {
      if (error) {
        return null;
      }
    })
  } else {
    return null;
  }
}
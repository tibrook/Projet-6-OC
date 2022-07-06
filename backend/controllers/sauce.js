const Sauce = require("../models/sauce");
const fs = require("fs");

/* Create Sauce  */
exports.createSauce = (req, res, next) => {
  // le type doit être en Fform-data et non en JSON
  const sauceObject = JSON.parse(req.body.sauce);

  delete sauceObject._id;
  //On remplacera le userID en bdd avec le middleware d'authentification
  delete sauceObject._userId;
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

/* Modify Sauce */
exports.modifySauce = (req, res, next) => {
  /* On verifie si req.file existe */
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
  /* On supprime le userID envoyé par le client afin d'éviter de le changer */
  delete sauceObject._userId;

  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      /* Puis on vérifie que le requérant est bien propriétaire de l'objet */
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: "unauthorized request" });
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
};

/* Delete Sauce */
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
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

/* AddLike */
exports.addLike = (req, res, next) => {
  //console.log(req.body.like);

  Sauce.findOne({ _id: req.params.id })

    .then((sauce) => {
      console.log(sauce.usersLiked);
      console.log(sauce.usersDisliked);
      const userFoundLike = sauce.usersLiked.find((user) => req.auth.userId);
      const userFoundDislike = sauce.usersDisliked.find(
        (user) => req.auth.userId
      );

      if (req.body.like == 1) {
        if (userFoundLike) {
        } else if (userFoundDislike) {
          sauce.dislikes--;
          sauce = supprUserlikeArray(sauce, req.auth.userId, "usersDisliked");
          sauce.likes++;
          sauce.usersLiked += req.auth.userId;
        } else {
          sauce.likes++;
          sauce.usersLiked += req.auth.userId;
        }
      } else if (req.body.like == 0) {
        if (userFoundLike) {
          sauce.likes--;

          supprUserlikeArray(sauce, req.auth.userId, "usersLiked");
          console.log(sauce);
        } else {
          sauce.dislikes--;
          supprUserlikeArray(sauce, req.auth.userId, "usersDisliked");
        }
      } else if (req.body.like == -1) {
        if (userFoundLike) {
          sauce.likes--;
          sauce = supprUserlikeArray(sauce, req.auth.userId, "usersLiked");
          sauce.dislikes++;
          sauce.usersLiked += req.auth.userId;
        } else if (userFoundDislike) {
        } else {
          sauce.dislikes++;
          sauce.usersLiked += req.auth.userId;
        }
      }

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

const supprUserlikeArray = (sauce, userId, tableUser) => {
  let arrayLength;
  if (tableUser == "usersLiked") {
    arrayLength = sauce.usersLiked.length;
  } else {
    arrayLength = sauce.usersDisliked.length;
  }
  for (let i = 0; i < arrayLength; i++) {
    if (sauce.usersLiked[i] === userId) {
      sauce.splice(i, 1);

      return sauce;
    }
  }
};

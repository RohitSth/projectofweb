const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");

// Upload image
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});

var upload = multer({
  storage: storage,
}).single("image");

// Insert an user to db route
router.post("/add", upload, (req, res) => {
  const user = new User({
    name: req.body.name,
    description: req.body.description,
    image: req.file.filename,
  });

  user
    .save()
    .then(() => {
      req.session.message = {
        type: "success",
        message: "User added successfully!",
      };
      res.redirect("/");
    })
    .catch((err) => {
      res.json({ message: err.message, type: "danger" });
    });
});

//Get all user routes
router.get("/", (req, res) => {
  User.find({})
    .exec()
    .then((users) => {
      res.render("index", {
        title: "Home Page",
        users: users,
      });
    })
    .catch((err) => {
      res.json({ message: err.message });
    });
});
router.get("/add", (req, res) => {
  res.render("add_users", { title: "Add Users" });
});

// Edit an user route
router.get("/edit/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);

    if (!user) {
      res.redirect("/");
    } else {
      res.render("edit_users", {
        title: "Edit User",
        user: user,
      });
    }
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

// update user route
router.post("/update/:id", upload, async (req, res) => {
  try {
    let id = req.params.id;
    let new_image = "";

    if (req.file) {
      new_image = req.file.filename;
      try {
        fs.unlinkSync("./uploads/" + req.body.old_image);
      } catch (err) {
        console.log(err);
      }
    } else {
      new_image = req.body.old_image;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name: req.body.name,
        image: new_image,
        description: req.body.description,
      },
      { new: true } // to get the updated user document
    );

    if (!updatedUser) {
      return res.json({ message: "User not found", type: "danger" });
    }

    req.session.message = {
      type: "success",
      message: "User updated successfully!",
    };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.json({ message: err.message, type: "danger" });
  }
});

// Delete user route
router.get("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Find the user to get the image filename before deletion
    const userToDelete = await User.findById(id);

    if (!userToDelete) {
      return res.json({ message: "User not found", type: "danger" });
    }

    // Delete the user document
    const deletedUser = await User.findByIdAndDelete(id);

    // Delete the associated image
    if (deletedUser.image) {
      try {
        fs.unlinkSync("./uploads/" + deletedUser.image);
      } catch (err) {
        console.log(err);
      }
    }

    if (!deletedUser) {
      return res.json({ message: "User not found", type: "danger" });
    }

    req.session.message = {
      type: "info",
      message: "User deleted Successfully!",
    };
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.json({ message: err.message, type: "danger" });
  }
});


module.exports = router;

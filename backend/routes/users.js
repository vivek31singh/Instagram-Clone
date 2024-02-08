var express = require("express");
var router = express.Router();
var { user } = require("../MongoDb");
var { post } = require("../MongoDb");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { log } = require("console");

// creating storage for profile Image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    return cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    return cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, "")}`);
  },
});

const upload = multer({ storage });

// creating storage for Post uploads
const postStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/postUploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, "")}`);
  },
});

const postUpload = multer({ storage: postStorage });

router.post("/signUp", async function (req, res, next) {
  const { mobileOrEmail, fullname, username, password } = req.body;

  const existingUser = await user.findOne({
    $or: [
      {
        email: mobileOrEmail,
      },
      { mobile: mobileOrEmail },
    ],
  });

  if (existingUser) {
    return res.status(400).json({ error: "user already exists" });
  }

  let email, mobile;

  if (mobileOrEmail.includes("@")) {
    email = mobileOrEmail;
  } else {
    mobile = mobileOrEmail;
  }

  const HashPassword = await bcrypt.hash(password, 10);

  const newUser = new user({
    email,
    mobile,
    fullname,
    username,
    HashPassword,
  });

  await newUser.save();

  res.status(201).json({ message: "user created successfully" });
});

router.post("/login", async function (req, res) {
  try {
    const { mobile_noOrusernameOremail, password } = req.body;

    const foundUser = await user.findOne({
      $or: [
        { email: mobile_noOrusernameOremail },
        { mobile: mobile_noOrusernameOremail },
        { username: mobile_noOrusernameOremail },
      ],
    });

    if (!foundUser) {
      return res.status(404).json({ error: "User not found", email: mobile_noOrusernameOremail });
    }

    const passwordMatch = await bcrypt.compare(password, foundUser.HashPassword);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid password", email: mobile_noOrusernameOremail });
    }

    // Check if profileImage exists before replacing backslashes
    const updatedProfileImage = foundUser.profileImage ? foundUser.profileImage.replace(/\\/g, "/") : null;

    return res.status(200).json({
      userId: foundUser._id,
      email: foundUser.email,
      mobile: foundUser.mobile,
      fullname: foundUser.fullname,
      username: foundUser.username,
      profileImage: updatedProfileImage,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch(
  "/uploadProfileImage/:userId",
  upload.single("profileImage"),
  async function (req, res) {
    try {
      const profileImage = req.file.path;
      const userId = req.params.userId;
      let updatedUser = await user.findOneAndUpdate(
        { _id: userId },
        { $set: { profileImage: profileImage } },
        { new: true }
      );

      // Check if the user was found and updated
      if (updatedUser) {
        const imagePath = `${req.protocol}://${req.get(
          "host"
        )}/${updatedUser.profileImage.replace(/\\/g, "/")}`;
        console.log("imagepath", imagePath);
        res.status(200).json({ profileImage: imagePath });
      } else {
        res.status(404).send("User not found");
      }

      // Handle further logic here
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
router.get(
  "/profileImage/:userId",

  async function (req, res) {
    try {
      const userId = req.params.userId;

      let updatedUser = await user.findOne({ _id: userId });

      if (updatedUser) {
        res.status(200).json({ profileImage: updatedUser.profileImage });
      } else {
        res.status(404).send("User not found");
      }

      // Handle further logic here
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.patch("/removeProfileImage/:userId", async function (req, res) {
  try {
    const userId = req.params.userId;

    let updatedUser = await user.findOneAndUpdate(
      { _id: userId },
      { $set: { profileImage: "" } },
      { new: true }
    );

    if (updatedUser) {
      res.status(200).json({ message: "Profile image updated successfully" });
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(
  "/uploadPost/:userId",
  postUpload.single("postFile"),
  async function (req, res) {
    try {
      const userId = req.params.userId;

      // Use req.file to access the uploaded file
      const postFile = req.file.path;
      const postFileUrl = `${req.protocol}://${req.get(
        "host"
      )}/${postFile.replace(/\\/g, "/")}`;

      // Extract other fields from req.body
      const { profileImage, username, caption } = req.body;

      const postDetails = {
        profileImage: profileImage,
        username: username,
        caption: caption,
        postFile: postFileUrl, // Use the file path directly
        userId: userId,
        likeCount:0,
      };

      const createdPost = await post.create(postDetails);

      res
        .status(201)
        .json({ message: "Post created successfully", post: createdPost });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/fetchUserPosts/:currentUserId", async function (req, res) {
  try {
    const currentUserId = req.params.currentUserId;

    const allPosts = await post.find({ userId: currentUserId });

    if (allPosts) {
      res
        .status(201)
        .json({ message: "Posts fetched successfully", posts: allPosts });
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

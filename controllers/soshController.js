const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const JWTStrategy = require("passport-jwt").Strategy;
const jsonwebtoken = require("jsonwebtoken");
const issueJWT = require("../config/issueJWT");
const multer = require("multer");
const fs = require("fs");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");
require("dotenv").config();

// used for storing images for use as User avatars.

const s3 = new aws.S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `${new Date().toISOString()}${file.originalname}`);
    },
  }),
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG and PNG files are accepted."), false);
  }
};

////////////////////////////////////////////////////

exports.imageUpdate = [
  uploadS3.single("image"),
  async (req, res, next) => {
    if (req.body.noImage) {
      try {
        let token = req.headers.authorization.split(" ")[1];
        let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
        let userID = decoded.sub;
        let user = await User.findById(userID);
        user.avatar = "";
        user.save();
        res.status(200).send("completed");
      } catch (err) {
        console.log(err);
      }
    }
    if (req.file) {
      try {
        let token = req.headers.authorization.split(" ")[1];
        let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
        let userID = decoded.sub;
        let user = await User.findById(userID);
        user.avatar = req.file.location;
        user.save(function (err) {
          if (err) {
            return next(err);
          }
        });
        res.send("completed");
      } catch (err) {
        console.log(err);
        res.status(500).send(err);
      }
    }
  },
];

exports.index = (req, res, next) => {
  try {
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
    let userID = decoded.sub;
    User.findById(userID, "username avatar").exec(function (err, user_details) {
      if (err) {
        res.send(err);
      }
      //Successful, so render
      else
        res.json({
          ...user_details,
        });
    });
  } catch (err) {
    console.log(err);
  }
};

exports.post_create_post = [
  body("content", "Please input some content").trim().isLength({ min: 1 }),

  async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // verify that the user making the post is authorized.
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
    let userID = decoded.sub;

    if (userID === req.body.author) {
      // Create a Post object with escaped and trimmed data.
      const post = new Post({
        author: req.body.author,
        content: req.body.content,
        date: new Date(),
        comments: [],
        stars: [],
      });

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.
        {
          res.send(errors);
          // errors: errors.array(),
        }
      } else {
        // saves new post as ObjectID under user who made the post.
        let result = await User.findById(post.author);
        result.posts.push(post._id);
        result.save(function (err) {
          if (err) {
            return next(err);
          }
        });
      }
      await post.save();
      let createdPost = await Post.findById(post._id).populate([
        { path: "author" },
        { path: "comments", populate: { path: "author" } },
      ]);
      res.json(createdPost);
    } else {
      res.status(403).send("You are not authorized to make this post.");
    }
  },
];

exports.post_details = [
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    let post = await Post.findById(req.params.post_id);
    res.json({ ...post._doc });
  },
];

exports.post_update = async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.post_id);
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
    let userID = decoded.sub;
    if (userID == post.author) {
      post.content = req.body.editedContent;
      post.edited = new Date();
      post.save();
      res.status(200).send("Post content successfuly edited.");
    } else {
      res.send("Invalid token.");
    }
  } catch (err) {
    console.log(err);
  }
};

exports.post_delete = async (req, res, next) => {
  let token = req.headers.authorization.split(" ")[1];
  let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
  let userID = decoded.sub;
  let user = await User.findById(userID);
  let filteredPosts = user.posts.filter((post) => post != req.params.post_id);
  user.posts = filteredPosts;

  let post = await Post.findById(req.params.post_id);

  // if authenication passes, delete the post.
  if (post.author == userID) {
    Post.findByIdAndDelete(req.params.post_id, (err, docs) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error deleting post.");
      } else {
        console.log(`Deleted ${docs}`);
      }
    });
    user.save();
    res.status(200).send("Post deletion successful.");
  } else {
    res.status(403).send("Authentication failed");
  }
};

exports.comment_details = async (req, res, next) => {
  let comment = await Comment.findById(req.params.comment_id).populate(
    "targetPost"
  );
  console.log(comment);
  res.json({ comment });
};

exports.add_Star_or_Comment = [
  body("content", "Comment must contain some content.")
    .trim()
    .isLength({ min: 1 }),

  async (req, res, next) => {
    let post = await Post.findById(req.params.post_id);
    let token = req.headers.authorization.split(" ")[1];
    let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
    let userID = decoded.sub;

    if (userID === req.body.author) {
      if (req.body.content) {
        const newComment = new Comment({
          targetPost: req.params.post_id,
          author: req.body.author,
          date: new Date(),
          content: req.body.content,
          comments: [],
          stars: [],
        });

        post.comments.push(newComment._id);

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          return res.json({ message: errors });
        } else {
          newComment.save().then(
            Post.findByIdAndUpdate(
              req.params.post_id,
              post,
              async function (err, result) {
                if (err) {
                  return next(err);
                } else {
                  res.json(result);
                }
              }
            )
          );
        }
      }

      if (req.body.userStar) {
        if (post.stars.includes(req.body.userStar)) {
          let newStars = post.stars.filter((item) => item != req.body.userStar);
          console.log(newStars);
          post.stars = newStars;
        } else {
          post.stars.push(req.body.userStar);
        }

        Post.findByIdAndUpdate(
          req.params.post_id,
          post,
          async function (err, result) {
            if (err) {
              return next(err);
            } else {
              res.json(result);
            }
          }
        );
      }
    } else {
      res.status(403).send("You are not authorized to edit this post.");
    }
  },
];

exports.comment_update = (req, res, next) => {
  res.send("Comment edit PUT");
};

exports.comment_delete = (req, res, next) => {
  res.send("Comment delete DELETE");
};

exports.user_profile = async (req, res, next) => {
  const user = await User.find({ username: req.params.user }, "username");
  res.json({ ...user });
};

exports.get_user_feed = async (req, res, next) => {
  const user = await User.find({ username: req.params.user }).populate(
    "followers following"
  );
  let query = await Post.paginate(
    { author: user },
    {
      sort: { date: -1 },
      populate: [
        { path: "author" },
        { path: "comments", populate: { path: "author" } },
      ],
      page: req.params.page,
      limit: 15,
    }
  );
  res.json({ posts: { ...query }, user: { ...user } });
};

exports.user_details_update = (req, res, next) => {
  res.send("Update user details.");
};

exports.imageDisplay = (req, res, next) => {
  res.send("image");
};

exports.signup_get = (req, res, next) => {
  res.render("signup");
};

exports.signup_post = async function (req, res, next) {
  //check if username already exists
  let checkResult = await User.findOne({
    username: req.body.username.toLowerCase(),
  });

  //if username does not exist, create user:
  if (!checkResult) {
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      const user = new User({
        username: req.body.username.toLowerCase(),
        password: hashedPassword,
        posts: [],
        following: [],
        followers: [],
        avatar: "",
      }).save();
      res.status(200).json({ message: "Successfully created user." });
    });
  }

  //if username does exist:
  else {
    res.status(409).json({ message: "This username already exists." });
  }
};

exports.login_get = function (req, res, next) {
  res.render("login", { user: req.user });
};

exports.login_post = async function (req, res, next) {
  await passport.authenticate(
    "local",
    {
      session: false,
      successRedirect: "/",
      failureRedirect: "/login",
    },
    (err, jwt) => {
      res.json(jwt);
      // localStorage.setItem("soshToken", jwt);
      // res.redirect("index");
    }
  )(req, res, next);
  // console.log(res);
};

exports.logout = function (req, res, next) {
  req.logout();
  res.redirect("/");
};

exports.search = function (req, res, next) {
  res.json({ search: `${req.params.searchQuery}` });
};

exports.findUsers = async function (req, res, next) {
  let userList = await User.find(
    { limit: 20 },
    "username avatar posts followers"
  );
  res.status(200).json({ userList });
};

exports.searchUsers = async function (req, res, next) {
  let userList = await User.find({
    username: { $regex: req.body.searchQuery, $options: "i" },
  });
  res.json(userList);
};

exports.change_user = async function (req, res, next) {
  let token = req.headers.authorization.split(" ")[1];
  let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
  let userID = decoded.sub;

  let userToBeFollowed = await User.findById(req.body.followee);
  let userToDoFollowing = await User.findById(req.body.follower);

  if (userID === req.body.follower) {
    if (userToBeFollowed.followers.includes(req.body.follower)) {
      let newFollowers = userToBeFollowed.followers.filter(
        (item) => item != req.body.follower
      );
      let newFollowing = userToDoFollowing.following.filter(
        (item) => item != req.body.followee
      );
      userToBeFollowed.followers = newFollowers;
      userToDoFollowing.following = newFollowing;
      userToBeFollowed.save();
      userToDoFollowing.save();
      res.status(200).json(userToDoFollowing);
    } else {
      userToBeFollowed.followers.push(req.body.follower);
      userToDoFollowing.following.push(req.body.followee);
      userToBeFollowed.save();
      userToDoFollowing.save();
      res.status(200).json(userToDoFollowing);
    }
  } else {
    res.status(403).send("You are not authorized to complete this action.");
  }
};

exports.homefeed = async (req, res, next) => {
  let token = req.headers.authorization.split(" ")[1];
  let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
  let userID = decoded.sub;
  let user = await User.findById(userID);
  let query = await Post.paginate(
    { $or: [{ author: user._id }, { author: { $in: user.following } }] },
    {
      sort: { date: -1 },
      populate: [
        { path: "author" },
        { path: "comments", populate: { path: "author" } },
      ],
      page: req.params.page,
      limit: 15,
    }
  );
  res.json({ ...query });
};

exports.get_post_data = async (req, res, next) => {
  const post = await Post.findById(req.params.post_id).populate([
    { path: "author" },
    { path: "comments", populate: { path: "author" } },
  ]);
  res.json(post);
};

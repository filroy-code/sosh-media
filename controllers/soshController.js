const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const JWTStrategy = require("passport-jwt").Strategy;
const jsonwebtoken = require("jsonwebtoken");
const issueJWT = require("../config/issueJWT");
require("dotenv").config();

exports.index = (req, res, next) => {
  let token = req.headers.authorization.split(" ")[1];
  let decoded = jsonwebtoken.verify(token, process.env.SESSION_SECRET);
  let userID = decoded.sub;
  User.findById(userID, "username posts")
    .sort({ date: -1 })
    .populate({
      path: "posts",
      populate: [
        {
          path: "author",
        },
        { path: "comments", populate: { path: "author" } },
      ],
    })
    .exec(function (err, list_posts) {
      if (err) {
        res.send(err);
      }
      //Successful, so render
      else
        res.json({
          ...list_posts,
        });
    });
};

// exports.post_create_get = (req, res, next) => {
//   res.render("new");
// };

exports.post_create_post = [
  body("content", "Please input some content").trim().isLength({ min: 1 }),

  async (req, res, next) => {
    console.log(req.body);

    // Extract the validation errors from a request.
    const errors = validationResult(req);

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

      // Data from form is valid. Save post.
      post.save(function (err) {
        if (err) {
          return next(err);
        }
        //successful - show created post object.
        Post.findById(post._id).exec(function (err, post) {
          if (err) {
            return next(err);
          }

          //Successful, so render
          res.json({ ...post });
        });
      });
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

exports.post_details_deets = async (req, res, next) => {
  let post = await Post.findById(req.params.post_id);
  res.render("post_details", { post: post });
};

exports.post_update = (req, res, next) => {
  res.send("Post update PUT");
};

exports.post_delete = (req, res, next) => {
  res.send("Post DELETE");
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
    // if (!(post.comments instanceof Array)) {
    //   if (typeof post.comments === "undefined") post.comments = [];
    //   else post.comments = new Array(post.comments);
    // }
    // if (!(post.stars instanceof Array)) {
    //   if (typeof post.stars === "undefined") post.stars = [];
    //   else post.stars = new Array(post.stars);
    // }

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
        console.log("hello");
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

exports.user_details_get = async (req, res, next) => {
  const user = await User.find({ username: req.params.user }, "username");
  res.json({ ...user });
};

exports.user_details_update = (req, res, next) => {
  res.send("Update user details.");
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
        connections: [],
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

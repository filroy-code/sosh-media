const Post = require("../models/post");
const Tag = require("../models/tag");
const User = require("../models/user");
const Comment = require("../models/comment");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const JWTStrategy = require("passport-jwt").Strategy;
const jsonwebtoken = require("jsonwebtoken");
const issueJWT = require("../config/issueJWT")
const { token } = require("morgan");
require("dotenv").config();

exports.index = function (req, res, next) {
  Post.find({}, "author content date tags comments stars")
    .sort({ date: -1 })
    .populate("tags")
    .exec(function (err, list_posts) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("index", {
        title: `Social Media`,
        post_list: list_posts,
        user: req.user,
        home: true,
      });
    });
};

exports.post_create_get = (req, res, next) => {
  res.render("new");
};

exports.post_create_post = [
  body("content", "Please input some content").trim().isLength({ min: 1 }),

  (req, res, next) => {
    console.log("processing");

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Post object with escaped and trimmed data.
    const post = new Post({
      // author: jwt.decode(),
      author: "john_bonham",
      content: req.body.content,
      date: new Date(),
      tags: [],
      comments: [],
      stars: 0,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.
        {
        res.render("new", {
          errors: errors.array(),
        })};
    }
    
    else {
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
          res.json({ ...post._doc });
        });
      });
    }
  },
];

exports.post_details = async (req, res, next) => {
  let post = await Post.findById(req.params.post_id)
  console.log(post)
  res.json({ ...post._doc });
};

exports.post_update = (req, res, next) => {
  res.send("Post update PUT");
};

exports.post_delete = (req, res, next) => {
  res.send("Post DELETE");
};

exports.comment_details = (req, res, next) => {
  res.send("Comment details");
};

exports.comment_create = (req, res, next) => {
  res.send("Comment create");
};

exports.comment_update = (req, res, next) => {
  res.send("Comment edit PUT");
};

exports.comment_delete = (req, res, next) => {
  res.send("Comment delete DELETE");
};

exports.user_profile = async (req, res, next) => {
  const user = await User.find({username: req.params.author}, "username")
  res.json( {...user} );
};

exports.user_details_get = (req, res, next) => {
  res.send("User details/preferences")
};

exports.user_details_update = (req, res, next) => {
  res.send("Update user details.");
};

exports.signup_get = (req, res, next) => {
  res.render("signup");
};

exports.signup_post = async function (req, res, next) {
  //check if username already exists
  let checkResult = await User.findOne({username: req.body.username.toLowerCase()})

  //if username does not exist, create user:
  if (!checkResult)
  {
    bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
      const user = new User({
        username: req.body.username.toLowerCase(),
        password: hashedPassword,
      })
        .save()
        res.json({message: "Successfully created user."})
    });
  } 

  //if username does exist:
  else {res.json({message: "This username already exists."})}}

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

const Post = require("../models/post");
const Tag = require("../models/tag");
const User = require("../models/user");
const Comment = require("../models/comment");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config();

exports.index = function (req, res, next) {
  Post.find({}, "title content date tags formatted_date comments")
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
  res.send("Post create GET");
};

exports.post_create_post = (req, res, next) => {
  res.send("Post create POST");
};

exports.post_details = (req, res, next) => {
  res.send("Post details GET");
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

exports.user_profile = (req, res, next) => {
  res.send("Show user profile.");
};

exports.user_details_get = (req, res, next) => {
  res.send("Get user details update page.");
};

exports.user_details_update = (req, res, next) => {
  res.send("Update user details.");
};

exports.signup_get = (req, res, next) => {
  res.send("Signup GET.");
};

exports.signup_post = (req, res, next) => {
  res.send("SIGNUP POST.");
};

exports.login_get = (req, res, next) => {
  res.send("Login GET");
};


exports.login_post = (req, res, next) => {
  res.send("Login POST");
};


exports.logout = function (req, res, next) {
  req.logout();
  res.redirect("/");
};

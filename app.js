var createError = require("http-errors");
var express = require("express");
var path = require("path");
const cors = require("cors");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;
const jsonwebtoken = require("jsonwebtoken");
const User = require("./models/user");
const bcrypt = require("bcryptjs");
const issueJWT = require("./config/issueJWT");
require("dotenv").config();

var mongoose = require("mongoose");
var mongoDB = process.env.DATABASE_CONNECTION;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var indexRouter = require("./routes/index");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// used to verify login credentials and issue JWT if valid.
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username.toLowerCase() }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          // passwords match! log user in
          const jwt = issueJWT(user);
          // console.log(jwt);
          return done(null, jwt);
        } else {
          // passwords do not match!
          return done(null, false, { message: "Incorrect password" });
        }
      });
    });
  })
);

const opts = {
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SESSION_SECRET,
  // opts.issuer = 'accounts.examplesoft.com';
  // opts.audience = 'yoursite.net';
};

passport.use(
  new JWTStrategy(opts, function (jwt_payload, done) {
    User.findOne(
      {
        _id: jwt_payload.sub,
      },
      function (err, user) {
        if (err) {
          res.status(401).json({ success: false, message: "No user found." });
        }
        if (user) {
          console.log(user);
          return done(null, user);
        } else {
          res
            .status(401)
            .json({ success: false, message: "You are not logged in." });
          // or you could create a new account
        }
      }
    );
  })
);

app.use(passport.initialize());

const corsOptions = {
  "Access-Control-Allow-Origin": "http://localhost:8080",
  "Access-Control-Allow-Methods": "GET, DELETE, POST, PUT",
  "Access-Control-Allow-Headers": "",
};

app.use(cors(corsOptions));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;

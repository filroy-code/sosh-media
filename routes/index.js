var express = require("express");
var router = express.Router();
var soshController = require("../controllers/soshController");

//HOMEPAGE
router.get("/", soshController.index);

//SEARCH
router.get("/search/:searchQuery", soshController.search);

//AUTHENTICATION
//User: Create
router.get("/signup", soshController.signup_get);
router.post("/signup", soshController.signup_post);

//User: Login & Logout
router.get("/login", soshController.login_get);
router.post("/login", soshController.login_post);

router.post("/logout", soshController.logout);

router.get("/homefeed/:page", soshController.homefeed);

//USERS
//User details: find user details
router.get("/users/:user/details", soshController.imageDisplay);

//User details: change user details
router.put("/users/:user/details", soshController.imageUpdate);

//COMMUNITY
router.get("/users", soshController.findUsers);

router.post("/search", soshController.searchUsers);

router.put("/users/:user", soshController.change_user);

router.get("/users/:user/:page", soshController.get_user_feed);

//POSTS
//Post: Create
router.post("/users/:user", soshController.post_create_post);

//Post: Details
router.get("/users/:user/:post_id", soshController.post_details);

//Post: Update
router.put("/users/:user/:post_id", soshController.post_update);

//Post: Delete
router.delete("/users/:user/:post_id", soshController.post_delete);

//COMMENTS
//Comment: Details
router.get("/users/:user/:post_id/:comment_id", soshController.comment_details);

//Comment & Star: Create
router.post("/users/:user/:post_id/", soshController.add_Star_or_Comment);

//Comment: Update
router.put("/users/:user/:post_id/:comment_id", soshController.comment_update);

//Comment: Delete
router.delete(
  "/users/:user/:post_id/:comment_id",
  soshController.comment_delete
);

router.get("/posts/:post_id", soshController.get_post_data);

module.exports = router;

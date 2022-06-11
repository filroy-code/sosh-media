var express = require("express");
var router = express.Router();
var soshController = require("../controllers/soshController");

//HOMEPAGE
router.get("/", soshController.index);

//AUTHENTICATION
//User: Create
router.get("/signup", soshController.signup_get);
router.post("/signup", soshController.signup_post);

//User: Login & Logout
router.get("/login", soshController.login_get);
router.post("/login", soshController.login_post);

router.post("/logout", soshController.logout);

//POSTS
//Post: Create
router.post("/:author", soshController.post_create_post);

//Post: Details
router.get("/:author/:post_id", soshController.post_details);
router.get("/:author/:post_id/deets", soshController.post_details_deets);

//Post: Update
router.put("/:author/:post_id", soshController.post_update);

//Post: Delete
router.delete("/:author/:post_id", soshController.post_delete);

//COMMENTS

//Comment: Details
router.get("/:author/:post_id/:comment_id", soshController.comment_details);

//Comment & Star: Create
router.post("/:author/:post_id/", soshController.add_Star_or_Comment);

//Comment: Update
router.put("/:author/:post_id/:comment_id", soshController.comment_update);

//Comment: Delete
router.delete("/:author/:post_id/:comment_id", soshController.comment_delete);

//USERS
//User: See profile.
router.get("/:author", soshController.user_profile);

//User: User details page.
router.get("/:author/details", soshController.user_details_get);

//User: Edit details (SUBMIT CHANGES).
router.put("/:author/details", soshController.user_details_update);

module.exports = router;

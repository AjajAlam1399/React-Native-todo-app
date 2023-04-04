const express = require("express");
const {
  Register,
  loginUser,
  logoutUser,
  forgetPassword,
  restPassword,
  updatePassword,
  verifyUser,
  addTask,
  removeTask,
  updateTask,
  getMyProfile,
  updateProfile,
} = require("../controllers/UserControllers");
const { isAuthenticatedUser } = require("../middleware/auth");
const router = express.Router();

router.route("/register").post(Register);
router.route("/verify").post(isAuthenticatedUser, verifyUser);

router.route("/me").get(isAuthenticatedUser, getMyProfile);

router.route("/login").post(loginUser);

router.route("/logout").get(isAuthenticatedUser, logoutUser);

router.route("/password/forget").put(isAuthenticatedUser, forgetPassword);
router.route("/password/reset/:token").put(isAuthenticatedUser, restPassword);
router.route("/update/password").put(isAuthenticatedUser, updatePassword);
router.route("/update/profile").put(isAuthenticatedUser, updateProfile);
router.route("/task/new").post(isAuthenticatedUser, addTask);

router
  .route("/task/:taskId")
  .put(isAuthenticatedUser, removeTask)
  .put(isAuthenticatedUser, updateTask);

module.exports = router;

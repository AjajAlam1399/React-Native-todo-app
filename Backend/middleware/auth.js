const catchAsyncError = require("./catchAsyncError");
const ErrorHandler = require("../utils/ErrorHandler");
const jwt = require("jsonwebtoken");
const User = require("../modules/User");

exports.isAuthenticatedUser = catchAsyncError(async (reqs, resp, next) => {
  const { token } = reqs.cookies;

  if (!token) {
    return next(new ErrorHandler("please Login to acess the resource", 400));
  }

  const verifyToken = await jwt.verify(token, process.env.JWT_TOKEN);

  // console.log(verifyToken);

  reqs.user = await User.findById(verifyToken.id);

  next();
});

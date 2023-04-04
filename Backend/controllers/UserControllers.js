const User = require("../modules/User");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncError = require("../middleware/catchAsyncError");
const sendToken = require("../utils/JWTtoken");
const { sendEmail, sendRegisterMail } = require("../utils/sendEmail");
const crypto = require("crypto");
const fs = require("fs");

const cloudinary = require("cloudinary");

// Register new User
exports.Register = catchAsyncError(async (reqs, resp, next) => {
  const { name, email, password } = reqs.body;

  const avatar = reqs.files.avatar.tempFilePath;

  let user = await User.findOne({ email });
  if (user) {
    return next(
      new ErrorHandler("Your are already register , please sign in", 400)
    );
  }
  const mycloud = await cloudinary.v2.uploader.upload(avatar, {
    folder: "todo-app",
  });
  //deleting temp file
  fs.rmSync("tmp", { recursive: true });
  const otp = Math.floor(Math.random() * 1000000);
  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
    otp,
    otpExpire: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
  });
  await sendRegisterMail({
    email,
    subject: "Register new User",
    message: `${otp} is Your Otp , please cofirm your varification`,
  });
  sendToken(user, 200, resp);
});

// verify user

exports.verifyUser = catchAsyncError(async (reqs, resp, next) => {
  const { otp } = reqs.body;
  if (!otp) {
    return next(new ErrorHandler("Enter otp first", 400));
  }
  const user = await User.findById(reqs.user.id);

  if (otp !== user.otp || user.otpExpire < Date.now()) {
    return next(new ErrorHandler("opt is Invalid or expire", 401));
  }

  user.varified = true;
  user.otp = null;
  user.otpExpire = null;
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, resp);
});

// Login User

exports.loginUser = catchAsyncError(async (reqs, resp, next) => {
  const { email, password } = reqs.body;

  if (!email || !password) {
    return next(new ErrorHandler("Enter your email and password", 400));
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("invalid email or password", 400));
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return next(new ErrorHandler("invalid email or password", 400));
  }

  sendToken(user, 200, resp);
});

// logout User
exports.logoutUser = catchAsyncError(async (reqs, resp, next) => {
  resp.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  resp.status(200).json({
    sucess: true,
    message: "You have been sucessfully logout",
  });
});

// Get all users --admin
exports.getMyProfile = catchAsyncError(async (reqs, resp, next) => {
  const user = await User.findById(reqs.user.id);

  const { name, email, avatar, task, varified } = user;

  const userData = {
    name,
    email,
    avatar,
    task,
    varified,
  };

  resp.status(200).json({
    sucess: true,
    userData,
  });
});

// restPassword

exports.forgetPassword = catchAsyncError(async (reqs, resp, next) => {
  const { email } = reqs.body;

  if (!email) {
    return next(new ErrorHandler("please Enter Your email", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new ErrorHandler(`${email} is not registered , please resister `, 400)
    );
  }

  const resetToken = await user.getRestPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${reqs.protocol}://${reqs.get(
    "host"
  )}/api/v1/password/reset/${resetToken}`;

  const message = `Your password rest token is : \n\n${resetPasswordUrl} \n\n If you have not requested please ignoure`;

  try {
    await sendEmail({
      email,
      subject: "RESET PASSWORD",
      message,
    });
    resp.status(200).json({
      sucess: true,
      message: "Reset Password Link has been sucessfully sent ",
    });
  } catch (error) {
    user.reSetPasswordToken = undefined;
    user.reSetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    resp.status(400).json({
      sucess: false,
      Error: error.message,
    });
  }
});

// reset password

exports.restPassword = catchAsyncError(async (reqs, resp, next) => {
  const reSetPasswordToken = crypto
    .createHash("sha256")
    .update(reqs.params.token)
    .digest("hex");

  const user = await User.findOne({
    reSetPasswordToken,
    reSetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler("restPasswordToken is invalid or Expire", 400)
    );
  }

  if (reqs.body.newPassword !== reqs.body.confirmPassword) {
    return next(
      new ErrorHandler("newPassword and confirmPassword does not match", 400)
    );
  }
  user.password = reqs.body.newPassword;
  user.reSetPasswordToken = undefined;
  user.reSetPasswordExpire = undefined;

  await user.save();
  sendToken(user, 200, resp);
});

// updatePassword

exports.updatePassword = catchAsyncError(async (reqs, resp, next) => {
  const { oldPassword, newPassword, confirmPassword } = reqs.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Enter oldPassword and newPassword", 400));
  }

  const user = await User.findById(reqs.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("old password is invalid", 401));
  }

  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("password does not match", 400));
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, resp);
});

// Update Profile
exports.updateProfile = catchAsyncError(async (reqs, resp, next) => {
  const { newName } = reqs.body;
  const avatar = reqs.files.avatar.tempFilePath;
  if (!newName) {
    return next(new ErrorHandler("Enter your new Name", 400));
  }

  const user = await User.findById(reqs.user.id);
  user.name = newName;

  if (avatar) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    const mycloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "todo-app",
    });
    //deleting temp file
    fs.rmSync("tmp", { recursive: true });
    user.avatar = {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    };
  }
  await user.save({ validateBeforeSave: false });

  sendToken(user, 200, resp);
});

// add tasks
exports.addTask = catchAsyncError(async (reqs, resp, next) => {
  // console.log(`${reqs.user.id} thsi is user id`);

  const { title, description } = reqs.body;

  const user = await User.findById(reqs.user.id);

  user.task.push({
    title,
    description,
    createdAt: new Date(Date.now()),
    completed: false,
  });

  user.save({ validateBeforeSave: false });

  resp.status(200).json({
    sucess: true,
    message: "Task has been sucessfuly added",
  });
});

// remove Task

exports.removeTask = catchAsyncError(async (reqs, resp, next) => {
  const { taskId } = reqs.params;
  const user = await User.findById(reqs.user.id);

  let newTask = user.task.filter(
    (items) => items._id?.toString() !== taskId?.toString()
  );

  user.task = newTask;

  await user.save({ validateBeforeSave: false });

  resp.status(200).json({
    sucess: true,
    message: "task has been sucessfully removed",
  });
});

// update Task

exports.updateTask = catchAsyncError(async (reqs, resp, next) => {
  const { taskId } = reqs.params;

  const user = await User.findById(reqs.user.id);

  let reqiredTask = user.task.find(
    (tasks) => tasks._id?.toString() === taskId?.toString()
  );
  if (!reqiredTask) {
    return next(new ErrorHandler("No such task exist", 401));
  }
  reqiredTask.completed = !reqiredTask.completed;

  user.save({ validateBeforeSave: false });

  resp.status(200).json({
    sucess: true,
    message: "Task has been sucessfull updated",
  });
});

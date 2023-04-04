const sendToken = (user, StatusCode, resp) => {
  let token = user.getJWTToken();

  // creating options for cookie
  let options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000 // given time in ms
    ),
    httpOnly: true,
  };

  const UserData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    tasks: user.tasks,
  };
  resp.status(StatusCode).cookie("token", token, options).json({
    sucess: true,
    token,
    UserData,
  });
};

module.exports = sendToken;

const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

//register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "this is sample id",
      url: "this is sample url",
    },
  });

  sendToken(user, 201, res);
});

//login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  //checking if user has given email and password
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Please enter email and password", 401));
  }

  const isPasswordMatched = user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Please enter email and password", 401));
  }

  sendToken(user, 200, res);
});

//logout user
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: "Logged Out" });

  //forgot password
  exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    //get reset password token

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetToken}`;

    const message = `Your reset password token is :- \n\n ${resetToken} \n\n If you have not requested this email, please ignore it.`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Reset Password",
        message,
      });

      res.status(200).json({
        success: true,
        message: `Email sent to ${user.email} successfully`,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new ErrorHandler(error.message, 500));
    }
  });

  //reset password
  exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
    //creating token hash
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(
        new ErrorHandler(
          "Reset password token is invalid or has been expired",
          400
        )
      );
    }

    if (req.body.password !== req.body.confirmPassword) {
      return next(new ErrorHandler("Password doesn't match", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);
  });

  //get user details
  exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  });

  //update password
  exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    const isPasswordMatched = user.comparePassword(req.body.oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }

    if (req.body.newPassword !== req.body.confirmPassword) {
      return next(new ErrorHandler("Password doesn't match", 400));
    }

    user.password = req.body.newPassword;

    await user.save();

    sendToken(user, 200, res);
  });

  //update user profile
  exports.updateUserProfile = catchAsyncErrors(async (req, res, next) => {
    const newUser = {
      name: req.body.name,
      email: req.body.email,
    };
    //add cloudinary for avatar

    const user = await User.findByIdAndUpdate(req.user.id, newUser, {
      new: true,
      runValidators: true,
      userFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      user,
    });
  });

  //get all users (admin)
  exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();

    if (!users) {
      return next(new ErrorHandler("No Record Found", 400));
    }

    res.status(200).json({
      success: true,
      users,
    });
  });

  //get single users (admin)
  exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const user = User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorHandler(`User doesn't exist with id ${req.params.id}`)
      );
    }

    res.status(200).json({
      success: true,
      user,
    });
  });

  //update user role - admin
  exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
    const newUser = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    };

    const user = await User.findByIdAndUpdate(req.user.id, newUser, {
      new: true,
      runValidators: true,
      userFindAndModify: false,
    });

    res.status(200).json({
      success: true,
      user,
    });
  });

  //delete user - admin
  exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(
        new ErrorHandler(`User with id ${req.params.id} doesn't exist`)
      );
    }

    await user.remove();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  });
});

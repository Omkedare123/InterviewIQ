const {Router} = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const AuthRouter = Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */

AuthRouter.post("/register", authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @access Public
 */

AuthRouter.post("/login", authController.loginUserController)


/**
 * @route GET /api/auth/logout
 * @description logout user with email and password
 * @access Public
 */

AuthRouter.get("/logout", authController.logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description get the user 
 * @access public
 */

AuthRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)

module.exports = AuthRouter;
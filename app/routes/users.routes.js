module.exports = (app) => {
  const { check, validationResult } = require("express-validator");
  const user = require("../controllers/user.controller.js");
  var authenticate = require("../middleware/authenticate.js");
  var router = require("express").Router();

  router.post(
    "/Signup",
    [
      check("Property_belongsto").not().isEmpty().trim().escape(),
      check("person_name").not().isEmpty().trim().escape(),
      check("Phone_number").not().isEmpty(),
      check("email").not().isEmpty(),
      check("user_type").not().isEmpty(),
      check("city").not().isEmpty(),
    ],
    user.Signup
  );

  // router.post(
  //   "/Signin",
  //   [
  //     check("email").not().isEmpty().trim().escape(),
  //     check("password").not().isEmpty().trim().escape(),
  //   ],
  //   user.Signin
  // );
  router.put(
    "/Edituser/:userId",
    authenticate,
    [check("userId").not().isEmpty().trim().escape()],
    user.Edituser
  );
  router.delete(
    "/Deleteuser/:userId", authenticate, user.deleteUser
  );
  router.get(
    "/getUser/:userId",authenticate, user.getUser
  );
  router.get(
    "/getAllUsers",authenticate, user.getAllUsers
  );

  app.use("/api/user", router);
};

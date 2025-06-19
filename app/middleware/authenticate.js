const jwt = require("jsonwebtoken");
const User = require("../models/User");

const manageToken = async (user_id, result) => {      
  var ID = typeof user_id != "object" ? user_id : user_id.id;
  
  const fetchUser = await User.findById(ID);
  
  if (fetchUser) {
    result(null, fetchUser);
    return;
  } else {
      result(null, null);
      return;
  }
};

const authenticate = (req, res, next) => {
  const authorization = req.headers["authorization"];
  if (authorization) {
    const token = authorization.replace("Bearer ", "").replace("bearer ", "");
    try {
      const decode = jwt.verify(token, "dont_be_oversmart");
      
      return manageToken(decode, (err, response) => {
        if (!err && response) {
          req.user = response;
          return next();
        }
        
        return res.status(401).send({
          error: "Unauthorized",
          message: "Authentication failed (token)1.",
        });
      });
    } catch (e) {
      return res.status(401).send({
        error: "Unauthorized",
        message: "Authentication failed (token)2.",
      });
    }
  }
  return res.status(401).send({
    error: "Unauthorized",
    message: "Authentication failed (token)3.",
  });
};
module.exports = authenticate;

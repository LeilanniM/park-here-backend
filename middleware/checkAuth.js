const jwt = require("jsonwebtoken");
const { JWT_KEY_SECRET } = require("../config");

//Auth middleware
const checkAuth = (req, res, next) => {
  try {
    const token = req.cookies.access_token; //exctract jwt cookie from request object.

    if (!token) {
      console.log("no token found, authentication failed.");
      return res.send("Access Denied 🤬");
    }

    //token found, now lets make sure its the right user
    const decodedToken = jwt.verify(token, JWT_KEY_SECRET);

    req.userId = decodedToken.userId; //adding a new key to the request object before passing it on through the pipeline
    next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { checkAuth };

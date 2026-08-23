const JWT = require("jsonwebtoken");
const { SECRET_TOKEN } = require("../config/serverConfig");

const AuthenticUser = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access token is missing",
      });
    }

    const decoded = JWT.verify(token, SECRET_TOKEN);

    // console.log("Decoded Token:", decoded);

    req.user = {
      userId: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    return res.status(403).json({
      message: "Invalid or expired access token",
    });
  }
};

module.exports = AuthenticUser;

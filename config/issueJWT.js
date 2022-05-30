const jsonwebtoken = require("jsonwebtoken");

function issueJWT(user) {
    const id = user._id;
  
    const expiresIn = "120";
  
    const payload = {
      sub: id,
      iat: Date.now(),
    };
  
    const signedToken = jsonwebtoken.sign(payload, process.env.SESSION_SECRET, {
      expiresIn: expiresIn,
    });
  
    return { token: "Bearer " + signedToken, expires: expiresIn };
  }

  module.exports = issueJWT
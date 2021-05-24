var express = require("express");
var router = express.Router();
const DButils = require("../modules/DButils");
const bcrypt = require("bcrypt");

router.post("/Register", async (req, res, next) => {
  try {
    // parameters exists
    // valid parameters
    // username exists
    const users = await DButils.execQuery("SELECT username FROM users");

    if (users.find((x) => x.username === req.body.username))
      throw { status: 409, message: "Username taken" };

    // add the new username
    let hash_password = bcrypt.hashSync(
      req.body.password,
      parseInt(process.env.bcrypt_saltRounds)
    );
    await DButils.execQuery(
      `INSERT INTO users VALUES (default, '${req.body.username}', '${hash_password}',
       '${req.body.firstName}', '${req.body.lastName}', '${req.body.country}', '${req.body.email}', '${req.body.profilePicture}')`
    );
    res.status(201).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Login", async (req, res, next) => {
  try {
    // check that username exists
    const users = await DButils.execQuery("SELECT username FROM users");
    if (!users.find((x) => x.username === req.body.username))
      throw { status: 401, message: "Username or Password incorrect" };

    // check that the password is correct
    const user = (
      await DButils.execQuery(
        `SELECT * FROM users WHERE username = '${req.body.username}'`
      )
    )[0];

    if (!bcrypt.compareSync(req.body.password, user.password)) {
      throw { status: 401, message: "Username or Password incorrect" };
    }

    // Set cookie
    req.session.user_id = user.user_id;
    // req.session.save();
    // res.cookie(session_options.cookieName, user.user_id, cookies_options);

    // return cookie
    res.status(200).send({ message: "login succeeded", success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/Logout", function (req, res) {
  req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
  res.status(200).send({ success: true, message: "logout succeeded" });
});

router.get("/getUserInfo", async (req, res, next) => {
  try {
    const userInfo = await DButils.execQuery(
      `SELECT firstName, lastName, country, email, profilePicture
     FROM users WHERE username = '${req.query.username}'`
    );
    //console.log(userInfo);node codes/main.js
    if (userInfo.length == 0) {
      res.status(200).send("There is no information for this user.");
    } else {
      // let userInformation = new Array();
      let firstName = userInfo[0].firstName;
      let lastName = userInfo[0].lastName;
      let country = userInfo[0].country;
      let email = userInfo[0].email;
      let image = userInfo[0].profilePicture;
      profileInformation = {
        firstName,
        lastName,
        country,
        email,
        image,
      };
      // userInformation[0] = profileInformation;
      res.status(200).send({ profileInformation });
      // res.status(200).send({ userInformation });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;

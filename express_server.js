// DEFINE constants: express, port, bodyParser, cookies, bcrypt
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");

const { urlDatabase, users } = require("./data/database");

// REQUIRE helper function from ./helpers
const { getUserByEmail } = require("./helpers");

// DEFINE uses: express, bodyParser, cookies
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["secret-keys-1", "secret-keys-2"],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
  })
);

// SET View Engine -> ejs 
app.set("view engine", "ejs");


// Function -> creates random ID for user's registration
function generateRandomString() {
  let result = Math.random().toString(36).slice(2, 8);
  return result;
}

// Function -> checks if the user email is valid
emailChecks = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

// Function -> checks if the user email and password matches
passwordMatchChecks = (email, password) => {
  for (let user in users) {
    const hashedPassword = users[user].password;
    if (users[user].email === email && bcrypt.compareSync(password, hashedPassword) ) {
      return true;
    }
  }
  return false;
};

// Function -> returns the URLs where the userID is equal to the id of the currently logged-in user
urlsForUser = (urlDatabase, id) => {
  let filteredUrls = {};
  let keys = Object.keys(urlDatabase);
  for (let key of keys) {
    if (urlDatabase[key].userID === id) {
      filteredUrls[key] = urlDatabase[key];
    }
  }
  return filteredUrls;
};

// GET Request -> redirect to /urls path (root)
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// GET Request -> to see the /urls path
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    return res.render("urls_errors", {
      message: "❗️ Already Registered? Click bloew to Login ❗️ If Not, Please Sign-Up First!",
      user: null,
    });
  }
  const user = users[user_id] || {};
  const getURL = urlsForUser(urlDatabase, req.session.user_id);
  const templateVars = { urls: getURL, user: user };
  res.render("urls_index", templateVars);
});

// POST Request -> after user submitts a new URL
app.post("/urls", (req, res) => {
  const user_id = req.session.user_id || {};
  if (!user_id) {
    return res.render("urls_errors", {
      message: "Please Register or Login",
      user: null,
    });
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: user_id,
  };
  res.redirect(`/urls/${shortURL}`);
});

// GET Request -> to view new URL form (after user submitts a new URL)
app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id === undefined) {
    res.redirect("/login"); // if user is not logged in: redirects to the /login page
    return;
  }
  const user = users[user_id] || {};
  const templateVars = { urls: null, user };
  console.log(user_id);
  res.render("urls_new", templateVars);
});

// GET Request -> to view new urls_show page
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== user_id) {
    return res.status(403).send("Access Denied");
  }
  if (urlDatabase[shortURL] === undefined) {
    return res.status(400).send("URL not found")
  }
  if (user_id === undefined) {
    user_id = "error";
  }
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[user_id],
  };
  res.render("urls_show", templateVars);
});

// GET Request -> to redirect to longURL page
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) { // If URL for the given ID does not exist: returns error message
    return res.send("shortURL cannot be found");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL); // If URL for the given ID exists: redirects to the corresponding long URL
});

// POST Request -> to submit editted version of the longURL
app.post("/urls/:id", (req, res) => {
  const user_id = req.session.user_id;
  if (user_id === undefined) {
    res.redirect("/register");
    return;
  }
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  console.log(urlDatabase);
  urlDatabase[shortURL] = { longURL, userID: user_id };
  res.redirect("/urls");
});

// POST Request -> to delete existing URL information from the database
app.post("/urls/:id/delete", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id] || {};
  const filteredData = urlsForUser(urlDatabase, user_id);
  if (!filteredData[req.params.id]) {
    return res.render("urls_errors", {
      user,
      message: "You don't have a permission",
    });
  }
  if (user == undefined) {
    res.redirect("/register");
    return;
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// GET Request -> to view registration page if the user is not logged in
app.get("/register", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = { user: users[user_id] };
  res.render("urls_registration", templateVars);
});

// GET Post -> to submit registered user information
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.status(400).send("Please check if all of your user information are filled");
  } else if (emailChecks(req.body.email)) {
    res.status(400).send("This email is already registered in our system");
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const randomString = generateRandomString();
    const newuser = {
      id: randomString,
      email: req.body.email,
      password: hashedPassword,
    };
    users[randomString] = newuser;
    req.session.user_id = randomString;
    res.redirect("/urls");
  }
});

// GET Request -> to view login page if the user is not logged in
app.get("/login", (req, res) => {
  const user_id = req.session.user_id;
  const templateVars = { user: users[user_id], errors: false };
  res.render("login_form", templateVars);
});

// POST Request -> to login with the user id and password
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userObject = getUserByEmail(email, users);
  if (!userObject) {
    return res.status(403).send("e-mail cannot be found");
  } else if (!passwordMatchChecks(email, password)) {
    return res.status(403).send("Your password doesn't match with your Id");
  } 
    req.session.user_id = userObject.id;
    res.redirect("/urls");
});

// POST Request -> to logout from the current user and clear all cookies
app.post("/logout", (req, res) => {
  req.session = null;
  return res.redirect("/urls");
});

// GET Request -> coverts URLDatabase to JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Server is listening !
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// DEFINE constants: express, port, bodyParser, cookies, bcrypt
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");

// DEFINE uses: express, bodyParser, cookies
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["secret-keys-1", "secret-keys-2"],
  })
);

// SET View Engine -> ejs 
app.set("view engine", "ejs");

// urlDatabase information 
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  sgq3y6: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// users information
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
  usID: {
    id: "usID",
    email: "1",
    password: "1",
  },
};

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

// Function -> 
function getUserByEmail(email, users) {
  for (let key of Object.keys(users)) {
    let userObj = users[key];
    if (userObj.email === email) {
      return userObj;
    }
  }
  return undefined;
}

// GET Request -> redirect to /urls path (root)
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// GET Request -> to see the /urls path
app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  if (!user_id) {
    return res.render("urls_errors", {
      message: "Please Register or Login",
      user: null,
    });
  }
  const user = users[user_id] || {};
  const getURL = urlsForUser(urlDatabase, user_id);
  const templateVars = { urls: getURL, user: user };
  res.render("urls_index", templateVars);
});

// POST Request -> after user submitts a new URL
app.post("/urls", (req, res) => {
  const user_id = req.cookies["user_id"] || {};
  if (!user_id) {
    return res.render("urls_errors", {
      message: "Please Register or Login",
      user: null,
    });
  }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  res.redirect(`/urls/${shortURL}`);
});

// GET Request -> to view new URL form (after user submitts a new URL)
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  if (req.cookies["user_id"] === undefined) {
    res.redirect("/login"); // if user is not logged in: redirects to the /login page
    return;
  }
  const user = users[user_id] || {};
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// GET Request -> to view new urls_show page
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  if (user == undefined) {
    res.redirect("/register");
    return;
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user,
  };
  res.render("urls_show", templateVars);
});

// GET Request -> to redirect to longURL page
app.get("/u/:shortURL", (req, res) => {
  if (!emailChecks(req.body.email)) { // If URL for the given ID does not exist: returns error message
    res.send("e-mail cannot be found");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL); // If URL for the given ID exists: redirects to the corresponding long URL
});

// POST Request -> to submit editted version of the longURL
app.post("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies["user_id"];
  if (user_id === undefined) {
    res.redirect("/register");
    return;
  }
  let shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

// POST Request -> to delete existing URL information from the database
app.post("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id] || {};
  const filteredData = urlsForUser(urlDatabase, user_id);
  if (!filteredData[req.params.shortURL]) {
    return res.render("urls_errors", {
      user,
      message: "You don't have a permission",
    });
  }
  if (user == undefined) {
    res.redirect("/register");
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// GET Request -> to view registration page if the user is not logged in
app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = { user: users[user_id] };
  res.render("urls_registration", templateVars);
});

// GET Post -> to submit registered user information
app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.send("Please check if all of your user information are filled", 400);
  } else if (emailChecks(req.body.email)) {
    res.send("This email is already registered in our system", 400);
  } else {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const newuser = {
      id: generateRandomString(),
      email: req.body.email,
      password: hashedPassword,
    };
    users[newuser.id] = newuser;
    console.log(users);
    res.cookie("user_id", newuser.id);
    res.redirect("/urls");
  }
});

// GET Request -> to view login page if the user is not logged in
app.get("/login", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = { user: users[user_id], errors: false };
  res.render("login_form", templateVars);
});

// POST Request -> to login with the user id and password
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userObject = getUserByEmail(email, users);
  if (!userObject) {
    return res.send("e-mail cannot be found");
  } else if (!passwordMatchChecks(req.body.email, req.body.password)) {
    return res.send("Your password doesn't match with your Id", 403);
  } 
    const user_id = userObject.id;
    res.cookie("user_id", user_id);
    res.redirect("/urls");
});

// POST Request -> to logout from the current user and clear all cookies
app.post("/logout", (req, res) => {
  const user_id = req.body.user_id;
  res.clearCookie("user_id", user_id);
  res.redirect("/urls");
});

// GET Request -> for /urls.json page path
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Server is listening !
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const res = require("express/lib/response");
const req = require('express/lib/request');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

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

function generateRandomString() {
  let result = Math.random().toString(36).slice(2, 8);
  return result;
}

emailChecks = (email) => {
  for (let user in users) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

passwordMatchChecks = (email, password) => {
  for (let user in users) {
    if (users[user].email === email && users[user].password === password) {
      return true;
    }
  }
  return false;
};

urlsForUser = (urlDatabase, id) => { // returns the URLs where the userID is equal to the id of the currently logged-in user.
  let filteredUrls = {};
  let keys = Object.keys(urlDatabase);
  for (let key of keys) {
    if (urlDatabase[key].userID === id) {
      filteredUrls[key] = urlDatabase[key]
    }
  }
  return filteredUrls;
};

function getUserByEmail(email, users) {
  for (let key of Object.keys(users)) {
    let userObj = users[key];
    if (userObj.email === email) {
      return userObj;
    }
  }
  return undefined;
}


app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"] 
  if (!user_id) { 
    return res.render("urls_errors", {message:"Please Register or Login", user: null} );
  }
  const user = users[user_id] || {};
  const getURL = urlsForUser(urlDatabase, user_id)  
  const templateVars = { urls: getURL, user: user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  // const user_id = req.cookies["user_id"]||{};
  // if (!user_id) { 
  //   return res.render("urls_errors", {message:"Please Register or Login", user: null} );
  // }
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"],
  };
  res.redirect(`/urls/${shortURL}`);
});

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

app.get("/u/:shortURL", (req, res) => {
  if (!emailChecks(req.body.email)) { // if URL for the given ID does not exist: returns error message
    res.send("e-mail cannot be found");
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL); // if URL for the given ID exists: redirects to the corresponding long URL
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id] || {};
  const filteredData = urlsForUser(urlDatabase, user_id);
  if (!filteredData[req.params.shortURL]) {
    return res.render("urls_errors",{user, message: "You don't have permission"});
  }
  if (user == undefined) {
    res.redirect("/register");
    return;
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login_form", { errors: false });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userObject = getUserByEmail(email, users)
  if (!userObject) {
    return res.send("e-mail cannot be found");
  } else if (!passwordMatchChecks(req.body.email, req.body.password)) {
    return res.send("Your password doesn't match with your Id", 403);
  } else {
    const user_id = userObject.id;
    res.cookie("user_id", user_id);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  const user_id = req.body.user_id;
  res.clearCookie("user_id", user_id);
  res.redirect("/urls");
});


app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  const templateVars = { user: users[user_id] };
  res.render("urls_registration", templateVars);
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.send("Please check if all of your user information are filled", 400);
  } else if (emailChecks(req.body.email)) {
    res.send("This email is already registered in our system", 400);
  } else {
    const newuser = {
      id: generateRandomString(),
      email: req.body.email,
      password: req.body.password,
    };
    users[newuser.id] = newuser;
    res.cookie("user_id", newuser.id);
    res.redirect("/urls");
  }
});

app.get("/", (req, res) => {
  if (!req.cookie.user_id) {
    res.redirect("/login"); // if user is not logged in: redirect to /login
  }
  res.redirect("/urls"); // if user is logged in: redirect to /urls
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


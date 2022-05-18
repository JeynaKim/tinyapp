const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const res = require('express/lib/response');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
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

  
app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id] || {};
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.cookies.user_id) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = req.body.longURL;
    res.redirect(`/urls/${shortURL}`)
  } else {
    res.send('request not success', 400);
  }
});
  

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user,
  };

  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const user_id = req.body.user_id;
  res.cookie("user_id", user_id );
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  const user_id = req.body.user_id;
  res.clearCookie("user_id", user_id);
  res.redirect("/urls");
});


app.get("/register", (req, res) => {
  res.render("urls_registration", { errors: false });
});

app.post("/register", (req, res) => {
  if (req.body.email === "" || req.body.password === "") {
    res.send("Please check if all of your user information are filled", 400)
  } else if (emailChecks(req.body.email)) {
    res.send("This email is already registered in our system", 400);
  } else {
    const newuser = {
      id: generateRandomString(),
      email: req.body.email,
      password: req.body.password
    }
    users[newuser.id] = newuser
    res.cookie("user_id", newuser.id);
    res.redirect("/urls");
  }
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


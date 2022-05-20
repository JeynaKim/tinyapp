const { urlDatabase, users } = require("./data/database");

// Function -> gets user's info, user lookup function
function getUserByEmail(email, database) {
  for (let key of Object.keys(database)) {
    let userObj = users[key];
    if (userObj.email === email) {
      return userObj;
    }
  }
  return undefined;
}
  
module.exports = { getUserByEmail };

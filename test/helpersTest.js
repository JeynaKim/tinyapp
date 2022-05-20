// REQUIRE Chai & helper function
const { assert } = require('chai');
const { users } = require('../express_server.js');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
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

// TEST CASES: getUserByEmail Function 
describe('getUserByEmail', function () {
  it('should return a user with valid email', function () {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });
  
  // Added another it statement to test that a non-existent email returns undefined
  it('should return undefined, if the email is not in our users database', function () {
    const user = getUserByEmail("jeyna@gmail.com", testUsers)
    const expectedUserID = undefined;
    assert.equal(user, expectedUserID);
  });
});


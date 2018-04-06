'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { TEST_MONGODB_URI } = require('../config'); ('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);


let token;
const fullname = 'Example User';
const username = 'exampleUser';
const password = 'examplePass';

before(function() {
  return mongoose.connect(TEST_MONGODB_URI)
    .then(() => mongoose.connection.db.dropDatabase());
});

beforeEach(function() {
  return User.create({
    _id,
    username,
    password,
    fullname
  });
});

afterEach(function () {
  // return User.remove();
  // alternatively you can drop the DB
  return mongoose.connection.db.dropDatabase();
});

after(function() {
  return mongoose.disconnect();
});




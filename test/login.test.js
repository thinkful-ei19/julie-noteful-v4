'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { JWT_SECRET, TEST_MONGODB_URI } = require('../config'); 

const User = require('../models/user');
const seedUsers = require('../db/seed/users');

const expect = chai.expect;

chai.use(chaiHttp);


// let token;
// const fullname = 'Example User';
// const username = 'exampleUser';
// const password = 'examplePass';

describe.only('Noteful API - Login', function() {

  before(function() {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function() {
    return User.insertMany(seedUsers);
  });

  afterEach(function () {
  // return User.remove();
  // alternatively you can drop the DB
    return mongoose.connection.db.dropDatabase();
  });

  after(function() {
    return mongoose.disconnect();
  });

  describe('Noteful /api/login', function() {
    it('Should return a valid auth token', function() {
      return chai.request(app).post('/api/login').send({username: 'user0', password: 'password'})
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body.authToken).to.be.a('string');
          const payload = jwt.verify(res.body.authToken, JWT_SECRET);
          expect(payload.user).to.not.have.property('password');
          expect(payload.user).to.deep.equal({
            'id': '333333333333333333333300',
            'fullname': 'User Zero',
            'username': 'user0',
          });
        });
    });

    it.only('Should reject requests with no credentials', function() {
      return chai.request(app).post('/api/login').send()
        .catch(err=> err.response)
        .then(res=> {
          expect(res).to.have.status(400);
        });
    });
  });


});
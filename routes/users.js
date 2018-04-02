'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const User = require('../models/user');

router.get('/users', (req, res, next)=> {
  User.find().then(results => {
    res.json(results);
  });
});

router.post('/users', (req, res, next) => {
  const { fullname, username, password} = req.body;
  
  /***** Never trust users - validate input *****/
  if (!username) {
    const err = new Error('Missing `username` in request body');
    err.status = 400;
    return next(err);
  }

  if (!password) {
    const err = new Error('Missing `password` in request body');
    err.status = 400;
    return next(err);
  }
  
  //   const newItem = { fullname, username, password};
  //   User.create(newItem)
  //     .then(result => {
  //       res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
  //     })
  //     .catch(err => {
  //       next(err);
  //     });  in place of this, it's below


  return User.hashPassword(password)
    .then(digest => {
      const newUser = {
        username,
        password: digest,
        fullname
      };
      return User.create(newUser);
    })
    .then(result => {
      return res.status(201).location(`/api/users/${result.id}`).json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });    
});

module.exports = router;
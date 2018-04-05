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

  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing '${missingField}' in request body`); //new Error = error.message  .message property
    err.status = 422;
    return next(err);
  }

  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }
  
  /***** Never trust users - validate input *****/
  //   if (!username) {
  //     const err = new Error('Missing `username` in request body');
  //     err.status = 400;
  //     return next(err);
  //   }

  //   if (!password) {
  //     const err = new Error('Missing `password` in request body');
  //     err.status = 400;
  //     return next(err);
  //   }
  
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
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
  
  const newItem = { fullname, username, password};
  User.create(newItem)
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
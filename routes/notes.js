'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

const Note = require('../models/note');
const Folder = require('../models/folder');
const Tag = require('../models/tag');

/* ========== GET/READ ALL ITEMS ========== */
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;
  const userId = req.user.id;

  let filter = {userId};

  /**
   * BONUS CHALLENGE - Search both title and content using $OR Operator
   *   filter.$or = [{ 'title': { $regex: re } }, { 'content': { $regex: re } }];
  */

  if (searchTerm) {
    const re = new RegExp(searchTerm, 'i');
    filter.title = { $regex: re };
  }

  if (folderId) {
    filter.folderId = folderId;
  }

  if (tagId) {
    filter.tags = tagId;
  }



  Note.find(filter)
    .populate('tags')
    .sort('created')
    .then(results => {
      res.json(results);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== GET/READ A SINGLE ITEM ========== */
router.get('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Note.findOne({_id:id, userId})
    .populate('tags')
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== POST/CREATE AN ITEM ========== */
router.post('/notes', (req, res, next) => {
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  const newNote = { title, content, tags, userId };
  
  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  //validating objectid
  if (mongoose.Types.ObjectId.isValid(folderId)) {
    newNote.folderId = folderId;
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }

  //if folderId, verify that the id belongs to user    
  function verifyFolderId(userId, folderId) {  
    if (!folderId) {
      return Promise.resolve();
    } 
    return Folder.findOne({_id: folderId, userId})
      .then(result => {
        if(!result) {
          return Promise.reject('Folder is not valid');
        }
      });
  }

  //if tagId, verify that the id belongs to the user
  function verifyTagId(userId, tags = []) {
    if (!tags.length) {
      return Promise.resolve();
    }
    return Tag.find({$and:[{_id:{$in: tags}, userId}]}) 
      .then(results => {
        if (tags.length !== results.length) {
          return Promise.reject('tag is not valid');
        }
      });
    
  }

  Promise.all([verifyFolderId, verifyTagId])
    .then(() =>
      Note.create(newNote))
    .then(result => {
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => {
      next(err);
    });
});

/* ========== PUT/UPDATE A SINGLE ITEM ========== */
router.put('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, content, folderId, tags } = req.body;
  const userId = req.user.id;
  const updateItem = { title, content, tags, folderId, userId };
  const options = { new: true };
  
  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  if (mongoose.Types.ObjectId.isValid(folderId)) {
    updateItem.folderId = folderId;
  }

  if (tags) {
    tags.forEach((tag) => {
      if (!mongoose.Types.ObjectId.isValid(tag)) {
        const err = new Error('The `id` is not valid');
        err.status = 400;
        return next(err);
      }
    });
  }




  //if folderId, verify that the id belongs to user    
  function verifyFolderId(userId, folderId) {  
    if (!folderId) {
      return Promise.resolve();
    } 
    return Folder.findOne({_id: folderId, userId})
      .then(result => {
        if(!result) {
          return Promise.reject('Folder is not valid');
        }
      });
  }
  
  //if tagId, verify that the id belongs to the user
  function verifyTagId(userId, tags = []) {
    if (!tags.length) {
      return Promise.resolve();
    }
    return Tag.find({$and:[{_id:{$in: tags}, userId}]}) 
      .then(results => {
        if (tags.length !== results.length) {
          return Promise.reject('tag is not valid');
        }
      });
      
  }
  
  Promise.all([verifyFolderId, verifyTagId])
    .then(() => {
      return Note.findByIdAndUpdate(id, updateItem, options)
        .populate('tags');})
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

/* ========== DELETE/REMOVE A SINGLE ITEM ========== */
router.delete('/notes/:id', (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  Note.findOneAndRemove({_id:id, userId})
    .then(result => {
      if (result) {
        res.status(204).end();
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

module.exports = router;
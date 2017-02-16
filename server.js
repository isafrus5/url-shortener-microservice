'use strict';

const express = require('express');
const shortid = require('shortid');
const validurl = require('valid-url');
const app = express();
const mongodb = require('mongodb');
const mLab = "mongodb://localhost:27017/url-shortener-microservice";
const MongoClient = mongodb.MongoClient;

const newLink = (collection, params, req, res, callback) => {
  const host = req.get('host');
  const shorted = shortid.generate();
  const urlShorted = `https://${host}/short/${shorted}`;
  const insertLink = { url: params, short_url: shorted };
  collection.insert([insertLink]);
  res.json({original_url: params, short_url: urlShorted});
};

app.get('/new/:url(*)', (req, res, next) => {
  MongoClient.connect(mLab, (err, db) => {
    if (err) {
      console.log(`Unable to connect DB: ${err}`);
    } else {
      console.log('DB connected: ${mLab}');
      const collection = db.collection('links');
      const params = req.params.url;
      
      if (!validurl.isHttpUri(params) && !validurl.isHttpsUri(params)) {
        res.json({error: 'make sure you have a valid url'});
      } else {
        newLink(collection, params, req, res, () => {
          db.close();
        });
      } 
    }
  });
});

app.get('/short/:short', (req, res, next) => {
  MongoClient.connect(mLab, (err, db) => {
    if (err) {
      console.log(`Unable to connect to server ${err}`);
    }
    
    const collection = db.collection('links');
    const params = req.params.short;

    const findLink = (db, callback) => {
      const query = [{'short_url': params }, { url: 1, _id: 0 }];
      collection.findOne({'short_url': params }, { url: 1, _id: 0 }, (err, doc) => {
        if (doc != null) {
          res.redirect(doc.url);
        } else {
           res.json({error: 'No corresponding shortlink found in the database'});
        }
      });
    };
  
    findLink(db, () => {
      db.close();
    });
  });
});

app.listen(8080);


const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb')
const mongoose = require('mongoose');

const uri = "mongodb://localhost:27017"
let client = new MongoClient(uri);

/* GET home page. */

router.get('/', function (req, res, next) {
  res.status(200).send('index', { title: 'Express' });
  console.log('Express js server');
});

router.get('/testConnection', async function (req, res, next) {
  let data;

  try {
    // Create a new MongoClient
    await client.connect()

  } catch (e) {
    console.log('client.connect() => error');
    res.status(400).json({
      "type": "error",
      "error": 400,
      "message": `Impossible de se connecter au server MongoDB ${e}`
    });
    return 400;
  }

  try {
    // Connect the client to the server
    data = await client.db('villeNancy').collection('parking').find().toArray();

  } catch (e) {
    res.status(400).json({
      "type": "error",
      "error": 400,
      "message": `impossible d'accèder aux données, collection Nancy introuvable ${e}`
    });
    return 400;
  } finally {
    //Ensures that the client will close when you finish/error
    //await client.close()
  }

  console.log('connection ok');
  res.status(200).json(data);


});

router.post('/parking/save', async function (req, res, next) {
  try {
    await client.connect();
    client.db('villeNancy').collection('parking').drop();
    client.db('villeNancy').collection('parking').insertMany(req.body)

  } catch (error) {
    res.status(400).json(`impossible d'insèrer en base ${error}`);
  };

  res.status(201).json(req.body);


});

router.post('/velos/save', async function (req, res, next) {
  try {
    await client.connect();
    client.db('villeNancy').collection('veloStations').drop();
    client.db('villeNancy').collection('veloStations').insertMany(req.body)

  } catch (error) {
    res.status(400).json(`impossible d'insèrer en base ${error}`);
  };

  res.status(201).json(req.body);


});

router.get('/parking/all', async function (req, res, next) {

  try {
    await client.connect();
    data = await client.db('villeNancy').collection('parking').find().toArray();
  } catch (error) {
    res.status(400).json(`impossible de rècupérer les données en base ${error}`);
  };

  res.status(200).json(data);

});

router.get('/velos/all', async function (req, res, next) {

  try {
    await client.connect();
    data = await client.db('villeNancy').collection('veloStations').find().toArray();
  } catch (error) {
    res.status(400).json(`impossible de rècupérer les données en base ${error}`);
  };

  res.status(200).json(data);

});

module.exports = router;

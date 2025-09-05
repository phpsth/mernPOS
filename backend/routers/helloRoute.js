// routes/helloRoutes.js - Hello world route definitions
const express = require('express');
const router = express.Router();
const helloController = require('../controllers/helloController');

// GET /api/hello - Basic hello world
router.get('/', helloController.getHello);

// GET /api/hello/world - Hello world with message
router.get('/world', helloController.getHelloWorld);

// POST /api/hello - Hello with custom name
router.post('/', helloController.postHello);

// GET /api/hello/user/:name - Hello with URL parameter
router.get('/user/:name', helloController.getHelloUser);

module.exports = router;
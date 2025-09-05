const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController.js');

router.get('/', courseController.getCourseName);

router.post('/', courseController.postCourse);

module.exports = router;
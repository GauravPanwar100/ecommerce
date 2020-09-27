const express = require('express');
const router = express.Router();

const { signup, signin, signout, requireSignin, hello } = require('../controllers/auth');
const { userSignUpValidator } = require('../validator/index');
//routes
router.post('/signup', userSignUpValidator, signup);
router.post('/signin', signin);
router.get('/signout', signout);
router.get('/hello', requireSignin, hello);

module.exports = router;
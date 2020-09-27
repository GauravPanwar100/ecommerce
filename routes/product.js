const express = require('express');
const router = express.Router();

const { create, read, productById, remove, update, list, listRelated, listCategories, listBySearch, photo } = require('../controllers/product');
const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');
const { userById } = require('../controllers/user');

//routes
router.get('/products', list); //for fetching all products
router.get('/product/:productId', read);
router.post('/product/create/:userId', requireSignin, isAuth, isAdmin, create);
router.delete('/product/:productId/:userId', requireSignin, isAuth, isAdmin, remove);
router.put('/product/:productId/:userId', requireSignin, isAuth, isAdmin, update);
router.get('/products/related/:productId', listRelated); // for fetching only related products
router.get('/products/categories', listCategories);
router.post('/products/by/search', listBySearch);
router.get('/product/photo/:productId', photo);

router.param('userId', userById); // any time url contains userId, userById method will run.
router.param('productId', productById);


module.exports = router;
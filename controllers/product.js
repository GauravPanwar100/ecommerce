const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');

const Product = require('../models/product');
const {errorHandler} = require('../helpers/dbErrorHandler');


exports.create = (req, res) => {
    let form = new formidable.IncomingForm(); // this will fetch all the form content
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error : 'Image could not be uploaded.'
            });
        }
        // validation on all fields
        const {name, description, price, category, quantity, shipping} = fields;
        if (!name || !description || !price || !category || !quantity || !shipping) {
            return res.status(400).json({
                error : 'All fields are required.'
            });
        }

        let product = new Product(fields);
        if (files.photo) {
            // console.log("file_photo>>", files.photo);
            // 1kb = 1000
            // 1mb = 1000000
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error : 'Image size must be less than or equal to 1 mb.'
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }
        product.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error : errorHandler(err)
                });
            }
            res.json(result);
        });
    });
};


exports.productById = (req, res, next, id) => {
    Product.findById(id).exec((err, product) => {
        if (err || !product) {
            return res.status(400).json({
                error : 'Product not found.'
            });
        }
        req.product = product;
        next();
    });
};

exports.read = (req, res) => {
    req.product.photo = undefined;
    return res.json(req.product);
};

exports.remove = (req, res) => {
    let product = req.product;
    product.remove((err, deletedProduct) => {
        if (err) {
            return res.status(400).json({
                error : errorHandler(err)
            });
        }
        res.json({
            message : 'Product deleted successfully.'
        });
    });
};


exports.update = (req, res) => {
    let form = new formidable.IncomingForm(); // this will fetch all the form content
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error : 'Image could not be uploaded.'
            });
        }
        // validation on all fields
        const {name, description, price, category, quantity, shipping} = fields;
        if (!name || !description || !price || !category || !quantity || !shipping) {
            return res.status(400).json({
                error : 'All fields are required.'
            });
        }

        let product = req.product;
        product = _.extend(product, fields);

        if (files.photo) {
            // console.log("file_photo>>", files.photo);
            // 1kb = 1000
            // 1mb = 1000000
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error : 'Image size must be less than or equal to 1 mb.'
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }
        product.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error : errorHandler(err)
                });
            }
            res.json(result);
        });
    });
};

/**
 * sell / arrival
 * by sell = /products?sortBy=sold&order=desc&limit=4
 * by arrival = /products?sortBy=createdAt&order=asc&limit=4
 * if no params are sent, then returned all products
 */

 exports.list = (req, res) => {
    let order = req.query.order ? req.query.order : 'asc'; //get params from the url like this.
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let limit = req.query.limit ? parseInt(req.query.limit) : 25;

    Product.find()
            .select("-photo")
            .populate("category")
            .sort([[sortBy, order]])
            .limit(limit)
            .exec((err, products) => {
                if (err) {
                    return res.status(400).json({
                        error : 'Product not found.'
                    });
                }
                res.json(products);
            });
 };

 /**
  * it will find the product based on request category.
  * first it will find the category and then its products.
  * products that have the same category, will be returned.
  */

  exports.listRelated = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 25;

    Product.find({_id : {$ne : req.product}, category : req.product.category}) //here $ne is a mongoDB variable whose functionality is not to include the same product in the results.and category is there to fetch product based on category.
            .limit(limit)
            .populate('category', '_id name') // fetch only id and name in the result from category table.
            .exec((err, products) => {
                if (err) {
                    return res.status(400).json({
                        error : 'Product not found.'
                    });
                }
                res.json(products);
            });
  };

exports.listCategories = (req, res) => {
    Product.distinct('category', {}, (err, categories) => {
        if (err) {
            return res.status(400).json({
                error : 'Categories not found.'
            });
        }
        res.json(categories);
    });
};

/**
 * list products by search
 * we will implement product search in react frontend.
 * we will show categories in checkbox and price range in radio buttons.
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 * @param {*} req 
 * @param {*} res 
 */
exports.listBySearch = (req, res) => {
    let order = req.query.order ? req.query.order : 'desc'; //get params from the url like this.
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let limit = req.query.limit ? parseInt(req.query.limit) : 100;

    let skip = parseInt(req.body.skip); // for implementing view more button functionality.
    let findArgs = {};

    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === 'price') {
                // gte - greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte : req.body.filters[key][0],
                    $lte : req.body.filters[key][1]
                };    
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    Product.find(findArgs)
            .select('-photo') // for don't select the photo
            .populate('category')
            .sort([[sortBy, order]])
            .skip(skip)
            .limit(limit)
            .exec((err, data) => {
                if (err) {
                    return res.status(400).json({
                        error : 'Products not found.'
                    });
                }
                res.json({
                    size : data.length,
                    data
                });
            });
};

exports.photo = (req, res, next) => {
    if (req.product.photo.data) {
        res.set('Content-Type', req.product.photo.contentType);
        return res.send(req.product.photo.data);
    }
    next();
};
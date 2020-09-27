const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const expressValidator = require('express-validator');
const category = require('./models/category');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');


require('dotenv').config();


//app
const app = express();

//db
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(() => {
    console.log(`Database connected successfully!! at ${process.env.DATABASE_URL}`)
});

//middlewares
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cookieParser());
// for validating user's data on signUp process
app.use(expressValidator());
app.use(cors()); // for handling cors related errors.


//routes middleware
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', categoryRoutes);
app.use('/api', productRoutes);


const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`App running on port ${port}`);
});
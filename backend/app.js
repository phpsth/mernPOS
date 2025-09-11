const express = require('express');
const app = express();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const helloRoutes = require('./routers/helloRoute.js');
const courseRoute = require('./routers/courseRoute.js');
const authRoute = require('./routers/authRoute.js');
const connectDB = require('./config/database.js');
const cors = require('cors');

connectDB();

// security middle-ware
app.use(helmet());

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // allow 100 times per 15 minutes
    message: 'ADMIN NOTICE: Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// morgan logging
// app.use(morgan('combined'));
app.use(morgan('common'));
// app.use(morgan('dev'));
// app.use(morgan('short'));
// app.use(morgan('tiny'));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/about', (req, res) => {
  res.send({message: 'About page', version: '1.0.0'});
});

app.get('/about-me', (req, res) => {
    res.send({firstName: "Jonh", lastName: "Doe"});
});

app.get('/bootcamp', (req, res) => {
    res.send({job: "Full Stack Developer", stack: "MERN"});
});

app.use(express.json());
app.use('/api/hello', helloRoutes)
app.use('/api/course', courseRoute)
app.use('/api/login', authRoute)

app.use('/api/products', require('./routers/productRoute.js'));
app.use('/api/categories', require('./routers/categoryRoute.js'));
app.use('/api/customers', require('./routers/customerRoute.js'));
app.use('/api/orders', require('./routers/orderRoute.js'));
app.use('/api/auth', require('./routers/authRoute.js'));
app.use('/api/users', require('./routers/userRoute.js'));
app.use('/api/stats', require('./routers/statsRoute.js'));

module.exports = app;
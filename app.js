const Joi = require('joi');
const express = require('express');
var cors = require('cors');
const app = express();
const multer = require('multer');
const upload = multer();
app.use(upload.array()); 

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

app.use(express.static('public'));
require('dotenv').config();


// routes
app.use(require('./src/routes/index'));

// middlewares 

// PORT
app.listen(process.env.PORT, ()=> console.log(`Listening on port ${process.env.PORT}...`));


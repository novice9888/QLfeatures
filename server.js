const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cors = require ('cors');

const port = 8080;

const contactandssscRouter = require('./routes/contactandssscRouter.js')

app.set('view engine', 'ejs');
app.set('views', __dirname+ '/views');
app.set('layout', 'layouts/layout');

app.use(expressLayouts);
app.use(express.static('public'))
// for forms to use URL encoded form data
app.use(express.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());

//Routes
app.use('/contactandsssc', contactandssscRouter);



app.listen(port, () => {
    console.log(
        
        `QL Sample Application - Server listening at port ${port}`
    );

   
}); 

const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const cors = require ('cors');

const { port  } = require('./config');


const indexRouter = require('./routes/index');
const fastlaneComponentRouter = require('./routes/fastlaneComponent');
const appSwitchRouter = require('./routes/appSwitchRouter');

const appSwitchApiRouter = require('./routes/appSwitchApiRouter');
const flukMerchantRouter = require('./routes/fastlaneUKMerchantRouter');
const flMerchantUKLiveRouter = require('./routes/flmerchantukLiveRouter.js');

const contactandssscRouter = require('./routes/contactandssscRouter.js')

app.set('view engine', 'ejs');
app.set('views', __dirname+ '/views');
app.set('layout', 'layouts/layout');

//dotenv.config();

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

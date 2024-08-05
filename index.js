require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const { URL: urlParse } = require('url');



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());



app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String
});

const URL = mongoose.model('URL', urlSchema);



app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  let hostname;
  try {
    const urlobj = new urlParse(url);
    hostname = urlobj.hostname;
  } catch (err) {
    return res.json({ error: 'invalid url'});
  }
  dns.lookup(hostname, async (err) => {
    if (err) {
      return res.json({ error: 'invalid url'});
    }

    const shorturl = shortid.generate();

    const newUrl = new URL({
      original_url: url,
      short_url: shorturl
    });

    try {
      const saveurl = await newUrl.save();
      res.json({original_url: url, short_url: shorturl});

    } catch (err) {
      console.log(err);
    }
    
  })
})

app.get('/api/shorturl/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const data = await URL.findOne({short_url: shortUrl});
    if (data) {
      res.redirect(data.original_url);
    } else {
      res.status(404).json({error: "No URL found"});
    }
  } catch (err) {
    console.log(err);
  }
} )


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

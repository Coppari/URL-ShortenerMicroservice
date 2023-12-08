require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const {MongoClient} = require('mongodb')

const dns = require('dns');
const urlParser = require('url');
const { error } = require('console');
const { HostAddress } = require('mongodb');

if (!process.env.DB_URL) {
  console.error("La variable de entorno DB_URL no está configurada correctamente.");
  process.exit(1);
}

const client = new MongoClient(process.env.DB_URL)
const db = client.db("urlshortner");
const urls  = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

//Middlewares
app.use(cors({
  origin: 'https://www.freecodecamp.org',
  optionsSuccessStatus: 200 // Algunos navegadores 204
}));
app.use(express.json())
app.use(express.urlencoded({extended : true})); 


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.post('/api/shorturl',(req, res) => {
  const url = req.body.url
  const dnsCallback = dns.lookup(urlParser.parse(url).hostname, async(error, address) => {
    if(!address){
      res.json({error: "Invalid URL"})
    }else {
      const incrementUrl = await urls.countDocuments({})
      const urlDoc = {
        url,
        shortURL: incrementUrl
      }
    
      const result = await urls.insertOne(urlDoc)
      console.log(result);
      res.json({originalUrl: url, shortURL: incrementUrl})
    }
    })
  });

  app.get('/api/shorturl/:short_url', async (req, res) => {
    const shortUrl = req.params.short_url;
    const originalUrl = await urls.findOne({ shortURL: parseInt(shortUrl) });
  
    if (originalUrl) {
      res.redirect(originalUrl.url);
    } else {
      res.json({ error: 'short url not found' });
    }
  });


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');
let mongoose = require('mongoose');
mongoose.set('strictQuery', false);

// Basic Configuration
const port = process.env.PORT || 3001;

app.use(cors())

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Inisialisasi schema
const Schema = mongoose.Schema;

// Buat schema
const linkSchema = new Schema({
  address: {
    type: String,
    required: true,
  },
  list: Number,
});

// inisialisasi model
let Link = mongoose.model('links', linkSchema);

// Route post
app.post('/api/shorturl', (req, res) => {
  // Ambil url
  let url = req.body.url;

  // Menggunakan function dns.lookup seperti yang disarankan oleh FreeCodeCamp
  dns.lookup(urlParser.parse(url).hostname, async (err, address, family) => {
    // Pengecekan apakah link nya valid
    if (!address || !family) {
      return res.json({
        'error': 'Invalid URL'
      })
    }

    // Mencari link di database
    link = await Link.findOne({
      address: url
    }).exec();

    // Mengecekan apakah di database link nya sudah terdaftar
    if (link !== null) {
      // Mengembalikan data
      return res.json({
        original_url: link.address,
        short_url: link.list
      });
    }

    // Menghitung data di database
    let count = await Link.find().countDocuments();

    // Membuat data baru
    let newLink = new Link({
      address: url,
      list: count + 1,
    })

    // Menyimpan data di database
    newLink.save();

    // Mengembalikan data
    return res.json({
      original_url: newLink.address,
      short_url: newLink.list
    });
  });

});

// Route get yang redirect ke link address nya
app.get('/api/shorturl/:short_url', async function(req, res) {
  // Mengambil parameter
  let short_url = Number(req.params.short_url);
  
  // Mencari data di database
  let link = await Link.findOne({
    list: short_url
  }).exec();

  // redirect ke link address
  res.redirect(link.address);
});

// database
let MONGO_URI = "mongodb+srv://username:password@cluster.jvkm2c0.mongodb.net/database?retryWrites=true&w=majority";
;

const start = async () => {
  try {
    // menghubungkan ke database
    await mongoose.connect(MONGO_URI);

    app.listen(port, function() {
      console.log(`Listening on port ${port}`);
    });
  } catch(e) {
    console.log(e.message)
  }
}

start();
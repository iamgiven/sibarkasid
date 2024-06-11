if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express')
const path = require('path');
const bodyParser = require('body-parser')
const ejs = require('ejs')
const app = express()
const bcrypt = require('bcrypt')
const multer = require('multer')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

const MongoClient = require('mongodb').MongoClient
const retrieveProducts = require('./retrieve-product.js')
const retrieveProductsByUsername = require('./retrieve-saved.js')
const retrieveUploadByUsername = require('./retrieve-upload.js')
const { retrieveProductById } = require('./detail-product.js')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});
const upload = multer({ storage: storage });


const initializePassport = require('./passport-config');
initializePassport(
  passport,
  async (email) => {
    const client = await MongoClient.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
    const db = client.db('sibarkasid');
    const user = await db.collection('users').findOne({ email: email });
    client.close();
    return user;
  },
  async (id) => {
    const client = await MongoClient.connect(process.env.MONGODB_URI, { useNewUrlParser: true });
    const db = client.db('sibarkasid');
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    client.close();
    return user;
  }
);


app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));


app.get('/', (req,res) => {
  res.redirect('/home')
})


app.get('/products', async (req, res) => {
  const keyword = req.query.keyword || '';
  try {
    const products = await retrieveProducts(keyword);
    res.render('pages/products', { products, keyword });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});


app.get('/products/:productId', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const productId = req.params.productId;

    if (!ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await retrieveProductById(productId);

    res.render('pages/product-page', {
      product: product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});


app.get('/user', checkAuthenticated, async (req, res) => {
  try {
    const products = await retrieveUploadByUsername(req.user.username);
    res.render('pages/user', {
      name: req.user.username,
      email: req.user.email,
      fullName: req.user.fullName,
      phone: req.user.phone,
      address: req.user.address,
      products: products
     });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving uploaded products');
  }
  
});


app.get('/login', checkNotAuthenticated, (req, res) => {
  res.render('user/login.ejs');
});

app.post(
  '/login',
  checkNotAuthenticated,
  passport.authenticate('local', {
    successRedirect: '/user',
    failureRedirect: '/login',
    failureFlash: true
  })
);

app.get('/signup', checkNotAuthenticated, (req, res) => {
  res.render('user/signup.ejs');
});

app.post('/signup', checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const client = await MongoClient.connect(url, { useNewUrlParser: true });
    const db = client.db('sibarkasid');

    await db.collection('users').insertOne({
      username: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });

    client.close();

    res.redirect('/login');
  } catch {
    res.redirect('/signup');
  }
});

app.get('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.redirect('/login');
  });
});


app.get('/home', (req, res) => {
  res.render('pages/home');
});


app.get('/saved', (req, res) => {
  if (req.isAuthenticated()) {
    return res.redirect('/saved/' + req.user.username);
  }
  return res.redirect('/login')
});


// route untuk menampilkan halaman saved product
app.get('/saved/:username', checkAuthenticated, savedAuthenticated, async function(req, res) {
  try {
    const products = await retrieveProductsByUsername(req.params.username);
    res.render('pages/saved', { products: products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving saved products');
  }
});


app.post('/toggleSave', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("sibarkasid");

    const productId = new ObjectId(req.body.productId);
    const user = req.user;

    // Check if the product is already saved
    const isProductSaved = await db.collection("users").findOne(
      { username: user.username, "saved.productId": productId }
    );

    if (isProductSaved) {
      await db.collection("users").updateOne(
        { username: user.username },
        { $pull: { saved: { productId: productId } } }
      );

      res.status(200).json({ saved: false }); // Respon sukses dengan status penyimpanan false
    } else {
      // If the product is not saved, add it
      await db.collection("users").updateOne(
        { username: user.username },
        { $push: { saved: { productId: productId } } }
      );

      res.status(200).json({ saved: true }); // Respon sukses dengan status penyimpanan true
    }

    client.close();
  } catch (error) {
    console.error(error);
    res.sendStatus(500); // Respon error
  }
});


app.post('/checkSavedStatus', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db("sibarkasid");

    const productId = new ObjectId(req.body.productId);
    const user = req.user;

    // Check if the product is already saved
    const isProductSaved = await db.collection("users").findOne(
      { username: user.username, "saved.productId": productId }
    );

    if (isProductSaved) {
      // If the product is already saved
      res.status(200).json({ saved: true }); // Respon dengan status penyimpanan true
    } else {
      // If the product is not saved
      res.status(200).json({ saved: false }); // Respon dengan status penyimpanan false
    }

    client.close();
  } catch (error) {
    console.error(error);
    res.sendStatus(500); // Respon error
  }
});


app.get('/user/upload', checkAuthenticated, (req, res) => {
  res.render('user/upload');
})


app.post('/upload', async (req, res) => {
  try {
    upload.single('img_barang')(req, res, async (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error uploading product');
      }

      const { ObjectId } = require('mongodb');
      const client = await MongoClient.connect(url, { useUnifiedTopology: true });
      const db = client.db("sibarkasid");

      const imgFilename = req.file.filename;
      const imgURL = `http://localhost:3000/uploads/${imgFilename}`;

      const productId = new ObjectId(); // Generate new ObjectId
      const linkURL = `http://localhost:3000/products/${productId.toHexString()}`; // Use the same ObjectId for link

      const product = {
        _id: productId,
        nama_barang: req.body.nama_barang,
        deskripsi_barang: req.body.deskripsi_barang,
        harga_barang: req.body.harga_barang,
        img_barang: imgURL,
        link_barang: linkURL,
        username: req.user.username,
        phone: req.user.phone
      };

      const result = await db.collection("products").insertOne(product);

      // Update uploaded products in the user's document
      await db.collection("users").updateOne(
        { username: req.user.username },
        { $push: { uploaded: { productId: productId } } }
      );

      client.close();

      res.redirect('/products');
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error uploading product');
  }
});


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/home');
  }
  next();
}

function savedAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.params.username === req.user.username) {
      return next();
    } else {
      res.status(403).send('Forbidden');
    }
  } else {
    res.redirect('/login');
  }
}


// untuk mengakses folder "public"
app.use(express.static('public'));
  

// Menjalankan server
app.listen(3000, () => {
  console.log('Server started on port 3000');
})


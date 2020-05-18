const express = require('express')
const http = require('http');

const path = require('path')
const sqlite3 = require('sqlite3').verbose()

var session = require('express-session')
var bodyParser = require('body-parser')

// Creation of the Express server
const app = express()
var userid = null

app.use(session({
	secret: 'secret',
	resave: true, 
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

// Login form (views/login.ejs)
app.post('/auth', function(request, response) {
	var username = request.body.username;
  var password = request.body.password;
	if (username && password) {
    const sql = 'SELECT * FROM accounts WHERE username = ? AND password = ?';
    db.all(sql, [username, password], (err, rows) => {
      if (rows.length > 0) {
        request.session.loggedin = true;
        request.session.username = username;
        userid = rows[0].id;
        response.redirect('/livres');
      } else {
        request.session.loggedin = false;
        response.send('Incorrect Username and/or Password!');
      }
      response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
  }
});

// Server configuration
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: false }))

// Connection to the SQlite3 database data/favoritesongs.db
const db_name = path.join(__dirname, 'data', 'favoritesongs.db')
const db = new sqlite3.Database(db_name, (err) => {
  if (err) {
    return console.error(err.message)
  }
  console.log("Successful connection to the database 'favoritesongs.db'")
})

// Table creation named FavoriteSongs
var sql_create = `CREATE TABLE IF NOT EXISTS FavoriteSongs (
  Favorite_ID INTEGER PRIMARY KEY AUTOINCREMENT,
  User_ID INTEGER NOT NULL,
  Bandname VARCHAR(50) NOT NULL,
  SongTitle VARCHAR(100) NOT NULL,
  Year VARCHAR(4) NOT NULL
);`

db.run(sql_create, (err) => {
  if (err) {
    return console.error(err.message)
  }
  console.log("Successful creation of the table 'FavoriteSongs'")

  // Table feeding to table FavoriteSongs
  var sql_insert = `INSERT or IGNORE INTO FavoriteSongs 
  (Favorite_ID, User_ID, Bandname, SongTitle, Year) VALUES
  (1, 1, 'Steffi', 'Sadness', '2011'),
  (2, 1, 'Tensnake', 'In the End (I Want You to Cry)', '2009'),
  (3, 1, 'Axel Boman', 'Purple Drank', '2010'),
  (4, 1, 'Omar-S', 'Psychotic Photosynthesis', '2007'),
  (5, 1, 'Luomo', 'Tessio', '2000'),
  (6, 1, 'The Other People Place', 'Sorrow and a Cup of Joe', '2002'),
  (7, 1, 'DJ Koze', 'Cicely', '2007'),
  (8, 1, 'Justin Martin', 'The Sad Piano (Charles Webster Remix)', '2003'),
  (9, 1, 'Andrés', 'New for U', '2012'),
  (10, 1, 'Gunnar Wendel', '578 (Omar S. Rude Boy Warm Mix)', '2010'),
  (11, 1, 'Chez N Trent', 'Morning Factory', '1994');`

  db.run(sql_insert, (err) => {
    if (err) {
      return console.error(err.message)
    }
    console.log("Successful storage in table 'Favoritesongs'")
  })
})

// Table creation named accounts
sql_create = `CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username varchar(50) NOT NULL,
  password varchar(255) NOT NULL,
  email varchar(100) NOT NULL
);`

db.run(sql_create, (err) => {
  if (err) {
    return console.error(err.message)
  }
  console.log("Successful creation of the table 'accounts'")

  // Table feeding to table accounts
  sql_insert = `INSERT or IGNORE INTO accounts 
  (id, username, password, email) VALUES
  (1, 'post@neoweb.no', 'test', 'post@neoweb.no'),
  (2, 'engan@database.no', 'test', 'engan@database.no'),
  (3, 'gjest@neoweb.no', 'test', 'gjest@neoweb.no');`

  db.run(sql_insert, (err, results) => {
    if (err) {
      return console.error(err.message)
    }
    console.log("Successful storage in table 'accounts'")
  })
})

// Server startup
app.listen(3000, () => {
  console.log('Server started (http://localhost:3000/) !')
})

// GET /
app.get('/', (req, res) => {
  // res.send("Hello world...");
  res.render('index')
})

// GET /data
app.get('/data', (req, res) => {
  const test = {
    tit: 'Test',
    items: ['En', 'to', 'tre'],
  }
  res.render('data', { model: test })
})

// GET /favsongs
app.get('/livres', (req, res) => {
  const sql = 'SELECT * FROM FavoriteSongs WHERE User_ID = ? ORDER BY SongTitle'
  db.all(sql, userid, (err, rows) => {
    if (err) {
      return console.error(err.message)
    }
    res.render('livres', { model: rows })
  })
})

// GET /login
app.get('/login', (req, res) => {
  //res.render('login', { model: {} })
  res.render('login')
})

// GET /create
app.get('/create', (req, res) => {
  res.render('create', { model: {} })
})

// POST /create
app.post('/create', (req, res) => {
  const sql =
    'INSERT INTO FavoriteSongs (User_ID, Bandname, SongTitle, Year) VALUES (?, ?, ?, ?)'
  const favsong = [userid, req.body.Bandname, req.body.SongTitle, req.body.Year]

  db.run(sql, favsong, (err) => {
    if (err) {
      return console.error(err.message)
    }
    res.redirect('/livres')
  })
})

// GET /edit/5
app.get('/edit/:id', (req, res) => {
  const id = req.params.id
  const sql = 'SELECT * FROM FavoriteSongs WHERE Favorite_ID = ?'
  db.get(sql, id, (err, row) => {
    if (err) {
      return console.error(err.message)
    }
    res.render('edit', { model: row })
  })
})

// POST /edit/5
app.post('/edit/:id', (req, res) => {
  const id = req.params.id
  const favsong = [req.body.Bandname, req.body.SongTitle, req.body.Year, id]
  const sql = 'UPDATE FavoriteSongs SET Bandname = ?, SongTitle = ?, Year = ? WHERE (Favorite_ID = ?)'
  db.run(sql, favsong, (err) => {
    if (err) {
      return console.error(err.message)
    }
    res.redirect('/livres')
  })
})

// GET /delete/5
app.get('/delete/:id', (req, res) => {
  const id = req.params.id
  const sql = 'SELECT * FROM FavoriteSongs WHERE Favorite_ID = ?'
  db.get(sql, id, (err, row) => {
    if (err) {
      return console.error(err.message)
    }
    res.render('delete', { model: row })
  })
})

// POST /delete/5
app.post('/delete/:id', (req, res) => {
  const id = req.params.id
  const sql = 'DELETE FROM FavoriteSongs WHERE Favorite_ID = ?'
  db.run(sql, id, (err) => {
    if (err) {
      return console.error(err.message)
    }
    res.redirect('/livres')
  })
})

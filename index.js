import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

// configure the application
env.config();
const app = express();
const port = process.env.PORT;

// connect the database
const db = new pg.Client({
  	user: process.env.DB_USER,
  	host: process.env.DB_HOST,
  	database: process.env.DB_DATABASE,
  	password: process.env.DB_PASSWORD,
  	port: process.env.DB_PORT,
});
db.connect();

// initialise middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// homepage route
app.get("/", (req,res) => {
	res.render("index.ejs");
});

// starts the application
app.listen(port, () => {
  	console.log(`Server running on port ${port}`);
});

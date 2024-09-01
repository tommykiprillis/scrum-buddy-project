// IGNORE EVERYTHIN FROM HERE ========================================
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

env.config();
const app = express();
const port = process.env.PORT;

const db = new pg.Client({
  	user: process.env.DB_USER,
  	host: process.env.DB_HOST,
  	database: process.env.DB_DATABASE,
  	password: process.env.DB_PASSWORD,
  	port: process.env.DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// TO HERE =========================================================

// 1: basic structure of a route
// app.<http method>("<endpoint>", async (req,res) => {
// - http method: what you want to do with this route (GET,POST,PUT,PATCH,DELETE)
// - endpoint: the "function" you want to call / the webpage you want to access
// - req: an object to get what the client is giving
// - res: an object to tell the client what to do next 
app.get("/", async (req,res) => {
    // 1. get any variables / resources coming from the client using req.body.<variable name>
    const taskName = req.body.task;

    // 2. do any other processing you want to do (eg. if statements, loops, database interaction, etc)
    if (taskName === "say hello") {
        console.log("hello to you too");
    }

    // 3. give something back to the user, usually out of two options:
    // a. render a web page using res.render("<webpage name>",{variable: value, variable: value, ....}); 
    // * each variable corresponds to a variable you want to display in the web page, and the value you want to give it
    res.render("homepage.ejs",{user: "kayden", age:"20", aura: "heaps"});

    // b. redirect the user to another endpoint using res.redirect("/endpoint");
    res.render("/coolroute");
});

// 2: interacting with the database
try { // must use try catch, as getting data back from the database may result in an error

    // const result = await db.query(<SQL query with $number for placeholders>,array of values for the placeholders);
    const result = await db.query("SELECT * FROM $1 WHERE id = $2",["items",3]);
    const items = result.rows; // this is an array of objects, where each item is a different entry in the database
    
    // example interaction
    const object1 = items[0]; // getting the first item in the array
    console.log(object1.name); // getting the name property of the item

} catch (err) {
    console.log(err);
} 

// starts the application
app.listen(port, () => {
  	console.log(`Server running on port ${port}`);
});



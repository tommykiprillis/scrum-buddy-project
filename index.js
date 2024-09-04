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

// send all the tasks from the database as an array called tasks (Tommy)
app.get("/", async (req,res) => {
	try {
		const result = await db.query("SELECT id, title, description FROM tasks");
		const tasks_array = result.rows;
		res.render("index.ejs", {tasks: tasks_array});
	} catch (err) {
		console.log(err);
	} 
});

// add a new task (name, description) to the database (Lii)
app.post("/add", async (req,res) => {
	// req.body.taskName, req.body.taskDescription


	res.redirect("/");
});

// edit a task (name or description) to the database (May)
app.post("/edit", async (req,res) => {
	// req.body.id, req.body.newName, req.body.newDescription

	res.redirect("/");
});

// delete a task (Ray)
app.post("/delete", async (req,res) => {
	// req.body.id

	res.redirect("/");
});

// assign a task to a user (Lily)
app.post("/assign", async (req,res) => {
	try {
        const { id, assignee } = req.body;
        await db.query("UPDATE tasks SET assignee = $1 WHERE id = $2",[assignee, id]);
        res.redirect("/");

    } catch (err) {
        console.log(err);
    }
});

// starts the application
app.listen(port, () => {
  	console.log(`Server running on port ${port}`);
});

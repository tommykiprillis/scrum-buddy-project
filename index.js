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
		
		const result = await db.query("SELECT * FROM tasks");
		const tasks_array = result.rows;
		res.render("index.ejs", {tasks: tasks_array});
	} catch (err) {
		console.log(err);
	} 
});

// add a new task (name, description) to the database (Lii)
app.post("/add", async (req,res) => {
	try {
		const taskName = req.body.taskName;
		const taskDescription = req.body.taskDescription;
		insertQuery = "INSERT INTO tasks($1,$2)"
		await db.query(insertQuery, [taskName,taskDescription]);
		res.redirect("/");
	} catch (err) {
		console.log(err);
	} 
});

// edit a task (name or description) to the database (May)
app.post("/edit", async (req,res) => {
	try {	
        const id = req.body.id;
	    const newName = req.body.newName
	    const newDescription = req.body.newDescription
	    await db.query('UPDATE tasks SET title = $1, description = $2 WHERE id = $3', [newName, newDescription, id])
        res.redirect("/");
	} catch (err) {
		console.log(err);
	} 

});

// delete a task (Ray)
app.post("/delete", async (req,res) => {
	try {
		const taskId = req.body.id;
		const deleteQuery = 'DELETE FROM tasks WHERE id = $1';
		await db.query(deleteQuery, [taskId]);
		res.redirect("/");
	} catch (err) {
		console.log(err);
	} 
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

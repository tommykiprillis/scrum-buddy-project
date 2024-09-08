import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import cookieParser from "cookie-parser";

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
app.use(cookieParser());

// send all the tasks from the database as an array called tasks (Tommy)
app.get("/", async (req,res) => {
	try {
        const viewPreference = req.cookies.view || "card";
        const sortPreference = req.cookies.sort || "priority";

        // NOTE: when doing the sorts, use for loops andappend for each into a bigger array, then output that one arry as below VV VV

        // get the tasks from each column
		const resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started'");
		const notStartedTasks = resultNotStarted.rows;

		const resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress'");
		const inProgressTasks = resultInProgress.rows;

		const resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed'");
		const completedTasks = resultCompleted.rows;
		res.render("index.ejs", {notStarted:notStartedTasks,inProgress:inProgressTasks,completed:completedTasks,view:viewPreference});
	} catch (err) {
		console.log(err);
	} 
});

// // get all of the tasks in the specified order (Tommy)
// app.get("/sorted" async (req,res) => {
//     // req.body.order = priority,title,story-points,status
// });

// change the view
app.post("/changeView", async (req,res) => {
    const viewPreference = req.body.view;
    res.cookie('view', viewPreference);
    res.redirect("/");
});

// move the task within the sprint backlog to either to do, in progress, done
app.post("/moveProgress", async (req,res) => {
    // req.body.id, req.body.destination
	try {
    	const taskID = req.body.id;
    	const newTaskProgress = req.body.destination
        await db.query('UPDATE tasks SET status = $2 WHERE id = $1', [taskID, newTaskProgress])
        res.redirect("/");
    } catch (err) {
        console.log(err);
    } 
});

// add a new task (name, description) to the database (Lii)
app.post("/add", async (req,res) => {
	try {
		const taskName = req.body.taskName;
		//const taskDescription = req.body.taskDescription;
		const insertQuery = "INSERT INTO tasks(title,status) VALUES ($1,'Not Started')"
		await db.query(insertQuery, [taskName]);
		res.redirect("/");
	} catch (err) {
		console.log(err);
	} 
});

// edit a task product backlog to the database (May) 
app.post("/edit", async (req,res) => {
	try {
        const id = req.body.id;
	    const newName = req.body.taskName
	    const newDescription = (req.body.taskDescription === '') ? null : req.body.taskDescription
		const newTag = (req.body.taskTag === '') ? null : req.body.taskTag
		const newPriority = (req.body.taskPriority === '') ? null : req.body.taskPriority
		const newStoryPoint = (req.body.taskStoryPoint === '') ? null : req.body.taskStoryPoint
        const newAssignee = (req.body.taskAssignee === '') ? null : req.body.taskAssignee
	    await db.query('UPDATE tasks SET title = $2, description = $3, tag = $4, priority = $5, story_points = $6, assignee = $7 WHERE id = $1', [id, newName, newDescription, newTag, newPriority, newStoryPoint, newAssignee])
        res.redirect("/");
	} catch (err) {
		console.log(err);
	} 

});

// edit a task sprint backlog to the database

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

// assign a task to a user (Lily) NOTE: to be used for when the product backlog is used
// app.post("/assign", async (req,res) => {
// 	try {
//         const { id, assignee } = req.body;
//         await db.query("UPDATE tasks SET assignee = $1 WHERE id = $2",[assignee, id]);
//         res.redirect("/");

//     } catch (err) {
//         console.log(err);
//     }
// });

// starts the application
app.listen(port, () => {
  	console.log(`Server running on port ${port}`);
});

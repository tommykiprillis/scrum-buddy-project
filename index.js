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

// routes for the homepage (product backlog)

// homepage view (product backlog)
app.get("/",async (req,res) => {
	try {
		// get view and sort preference of the user
        const viewPreference = req.cookies.view || "card";
		const sortPreference = req.cookies.sort || "priority";
		
		
        // get the tasks from each column
		let resultNotStarted;
		let notStartedTasks;

		let resultInProgress;
		let inProgressTasks;

		let resultCompleted;
		let completedTasks;
		
		// sort by alphabetical order
		if (sortPreference === "name"){
			// get the tasks from each column
			resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started' ORDER BY title");
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress' ORDER BY title");
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed' ORDER BY title");
			completedTasks = resultCompleted.rows;
		// // group the tags together
		} else if (sortPreference === "tag"){
			// get the tasks from each column
			resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started' ORDER BY tag IS NULL, tag DESC");
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress' ORDER BY tag IS NULL, tag DESC");
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed' ORDER BY tag IS NULL, tag DESC");
			completedTasks = resultCompleted.rows;
		// // sort in story point order
		} else if (sortPreference === "story_points"){
			// get the tasks from each column
			resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started' ORDER BY story_points IS NULL, story_points DESC");
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress' ORDER BY story_points IS NULL, story_points DESC");
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed' ORDER BY story_points IS NULL, story_points DESC");
			completedTasks = resultCompleted.rows;
		// // sort by priority
		} else if (sortPreference === "priority"){
			// get the tasks from each column
			resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started' ORDER BY priority IS NULL, priority DESC");
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress' ORDER BY priority IS NULL, priority DESC");
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed' ORDER BY priority IS NULL, priority DESC");
			completedTasks = resultCompleted.rows;
		}
		res.render("index.ejs", {notStarted:notStartedTasks,inProgress:inProgressTasks,completed:completedTasks,view:viewPreference});
	} catch (err) {
		console.log(err);
	} 	
});

// change the view (product backlog)
app.post("/changeView", async (req,res) => {
    const viewPreference = req.body.view;
    res.cookie('view', viewPreference);
    res.redirect("/");
});

// change the sort (product backlog)
app.post("/changeSort", async (req,res) => {
    const sortPreference = req.body.sort;
    res.cookie('sort', sortPreference);
    res.redirect("/");
});

// add a new task (product backlog)
app.post("/add", async (req,res) => {
	try {
		const taskName = req.body.taskName;
		//const taskDescription = req.body.taskDescription;
		const insertQuery = "INSERT INTO tasks(title) VALUES ($1)"
		await db.query(insertQuery, [taskName]);
		res.redirect("/");
	} catch (err) {
		console.log(err);
	} 
});

// edit a task (product backlog)
app.post("/edit", async (req,res) => {
	try {
        const id = req.body.id;
	    const newName = req.body.taskName
	    const newDescription = (req.body.taskDescription === '') ? null : req.body.taskDescription
		const newTag = (req.body.taskTag === '') ? null : req.body.taskTag
		const newPriority = (req.body.taskPriority === '') ? null : req.body.taskPriority
		const newStoryPoint = (req.body.taskStoryPoint === '') ? null : req.body.taskStoryPoint
	    await db.query('UPDATE tasks SET title = $2, description = $3, tag = $4, priority = $5, story_points = $6 WHERE id = $1', [id, newName, newDescription, newTag, newPriority, newStoryPoint])
        res.redirect("/");
	} catch (err) {
		console.log(err);
	} 

});

// delete a task (product backlog)
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

// create a new sprint (product backlog)
app.post("/createSprint", async (req,res) =>{

});

// routes for the sprint view

// view a sprint (sprint)
app.get("/viewSprint", async (req,res) => {
	try {
		// get view and sort preference of the user
        const viewPreference = req.cookies.view || "card";
		const sortPreference = req.cookies.sort || "priority";
		
		
        // get the tasks from each column
		let resultNotStarted;
		let notStartedTasks;

		let resultInProgress;
		let inProgressTasks;

		let resultCompleted;
		let completedTasks;
		
		// sort by alphabetical order
		if (sortPreference === "name"){
			// get the tasks from each column
			resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started' ORDER BY title");
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress' ORDER BY title");
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed' ORDER BY title");
			completedTasks = resultCompleted.rows;
		// // group the tags together
		} else if (sortPreference === "tag"){
			// get the tasks from each column
			resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started' ORDER BY tag IS NULL, tag DESC");
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress' ORDER BY tag IS NULL, tag DESC");
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed' ORDER BY tag IS NULL, tag DESC");
			completedTasks = resultCompleted.rows;
		// // sort in story point order
		} else if (sortPreference === "story_points"){
			// get the tasks from each column
			resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started' ORDER BY story_points IS NULL, story_points DESC");
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress' ORDER BY story_points IS NULL, story_points DESC");
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed' ORDER BY story_points IS NULL, story_points DESC");
			completedTasks = resultCompleted.rows;
		// // sort by priority
		} else if (sortPreference === "priority"){
			// get the tasks from each column
			resultNotStarted = await db.query("SELECT * FROM tasks WHERE status = 'Not Started' ORDER BY priority IS NULL, priority DESC");
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query("SELECT * FROM tasks WHERE status = 'In Progress' ORDER BY priority IS NULL, priority DESC");
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query("SELECT * FROM tasks  WHERE status = 'Completed' ORDER BY priority IS NULL, priority DESC");
			completedTasks = resultCompleted.rows;
		}
		res.render("index.ejs", {notStarted:notStartedTasks,inProgress:inProgressTasks,completed:completedTasks,view:viewPreference});
	} catch (err) {
		console.log(err);
	} 
});

// change the view (sprint)
app.post("/changeSprintView", async (req,res) =>{
    const viewPreference = req.body.view;
    res.cookie('view', viewPreference);
    res.redirect("/viewSprint");
});

// change the sort (sprint)
app.post("/changeSprintSort", async (req,res) =>{
    const sortPreference = req.body.sort;
    res.cookie('sort', sortPreference);
    res.redirect("/viewSprint");
});

// move a task from the sprint to the product backlog (sprint)
app.post("/moveToBacklog", async (req,res) =>{

});

// move a task from the product backlog to sprint (product backlog)
app.post("/moveToSprint", async (req,res) =>{

});

// update which sprint we are currently viewing (sprint)
app.post("setSprintView", async (req,res) =>{

});

// edit the details of a sprint (sprint)
app.post("/editSprint", async (req,res) =>{

});

// delete a sprint (sprint)
app.post("/deleteSprint", async (req,res) =>{

});

// view a burndown chart (sprint)
app.post("/viewBurndownChart", async (req, res) => {
	try {
		// get sprint ID from the cookies
		const sprintId = req.cookies.currentSprintId;

		// get the sprint details (start and end date)
		const sprintResult = await db.query(
			"SELECT start_date, end_date FROM sprints WHERE id = $1", [sprintId]
		);
		const sprint = sprintResult.rows[0];
		const { start_date: sprintStartDate, end_date: sprintEndDate } = sprint;

		// get the total story points for the sprint tasks
		const totalStoryPointsResult = await db.query(
			"SELECT SUM(story_points) AS total_story_points FROM tasks WHERE sprint_id = $1", [sprintId]
		);
		const totalStoryPoints = totalStoryPointsResult.rows[0].total_story_points || 0;

		// get task completion data
		const taskCompletionResult = await db.query(
			"SELECT date_completed, story_points FROM tasks WHERE sprint_id = $1 AND date_completed IS NOT NULL", [sprintId]
		);
		const tasksCompleted = taskCompletionResult.rows;

		// Generate daily burndown data
		const actualBurndownData = [];
		const idealBurndownData = [];
		let remainingStoryPoints = totalStoryPoints;

		let currentDate = new Date(sprintStartDate);
		const endDate = new Date(sprintEndDate);

		let dayNumber = 1;
		const totalDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) + 1;

		while (currentDate <= endDate) {
			// Calculate completed story points by current day
			let completedPoints = 0;
			for (const task of tasksCompleted) {
				const completionDate = new Date(task.date_completed); 
				if (completionDate <= currentDate) {
					completedPoints += task.story_points;
				}
			}

			// Update remaining story points
			remainingStoryPoints = totalStoryPoints - completedPoints;

			// Add to burndown data with day number
			actualBurndownData.push({
				day: dayNumber,
				storyPoints: remainingStoryPoints
			});

			// Calculate ideal remaining story points
			const idealRemainingPoints = totalStoryPoints * (1 - dayNumber / totalDays);
			idealBurndownData.push({
				day: dayNumber,
				storyPoints: idealRemainingPoints
			});

			// Move to the next day
			currentDate.setDate(currentDate.getDate() + 1);
			dayNumber++;
		}

		// Determine the current day number of the sprint
		const today = new Date();
		const currentDayNumber = Math.floor((today - new Date(sprintStartDate)) / (1000 * 60 * 60 * 24)) + 1;

		// Filter the data based on the current day number
		const filteredActualData = actualBurndownData.filter(data => data.day <= currentDayNumber);
		const filteredIdealData = idealBurndownData.filter(data => data.day <= currentDayNumber);

		// Send the burndown data to burndown.ejs
		res.render("burndown.ejs", {
			actualBurndownData: JSON.stringify(filteredActualData),
			idealBurndownData: JSON.stringify(filteredIdealData),
			sprintId: sprintId
		});

	} catch (err) {
		console.error(err);
	}
});


// assign a task to a user 
app.post("/assign", async (req,res) => {
	try {
        const { id, assignee } = req.body;
        await db.query("UPDATE tasks SET assignee = $1 WHERE id = $2",[assignee, id]);
        res.redirect("/viewSprint");

    } catch (err) {
        console.log(err);
    }
});

// move the task within the sprint backlog to either to do, in progress, done
app.post("/moveProgress", async (req,res) => {
    // req.body.id, req.body.destination
	try {
    	const taskID = req.body.id;
    	const newTaskProgress = req.body.destination
        await db.query('UPDATE tasks SET status = $2 WHERE id = $1', [taskID, newTaskProgress])
        res.redirect("/viewSprint");
    } catch (err) {
        console.log(err);
    } 
});



// starts the application
app.listen(port, () => {
  	console.log(`Server running on port ${port}`);
});

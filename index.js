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
		let result;
		let backlogTasks;

		const sprintsResult = await db.query("SELECT * from sprints");
		const backlogSprints = sprintsResult.rows;
		// sort by alphabetical order
		if (sortPreference === "name"){
			// get the tasks from each column
			result = await db.query("SELECT * FROM tasks WHERE location IS NULL ORDER BY title");
			backlogTasks = result.rows;
		// // group the tags together
		} else if (sortPreference === "story_points"){
			// get the tasks from each column
			result = await db.query("SELECT * FROM tasks WHERE location IS NULL ORDER BY story_points IS NULL, story_points DESC");
			backlogTasks = result.rows;
		// // sort by priority
		} else if (sortPreference === "priority"){
			// get the tasks from each column
			result = await db.query("SELECT * FROM tasks WHERE location IS NULL ORDER BY priority IS NULL, priority DESC");
			backlogTasks = result.rows;
		}
		res.render("index.ejs", {tasks: backlogTasks, sprints: backlogSprints, view:viewPreference});
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
		const newTags = (req.body.taskTags === '') ? null : req.body.taskTags
		const newPriority = (req.body.taskPriority === '') ? null : req.body.taskPriority
		const newStoryPoint = (req.body.taskStoryPoint === '') ? null : req.body.taskStoryPoint
	    await db.query('UPDATE tasks SET title = $2, description = $3, tags = $4, priority = $5, story_points = $6 WHERE id = $1', [id, newName, newDescription, newTags, newPriority, newStoryPoint])
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
	try {
		const sprintName = req.body.name;
		const sprintStartDate = req.body.startDate;
		const sprintEndDate = req.body.endDate;

		const result = await db.query("INSERT INTO sprints (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING id", [sprintName, sprintStartDate, sprintEndDate])
		
		const newSprintId = result.rows[0].id;

		res.cookie('currentSprintId', newSprintId);
		res.redirect("/viewSprint");
	} catch (err) {
		console.log(err);
	} 
});

// routes for the sprint view

// view a sprint (sprint)
app.get("/viewSprint", async (req,res) => {
	try {
		// get view and sort preference of the user
		const currentSprint = req.cookies.currentSprintId;
        const viewPreference = req.cookies.view || "card";
		const sortPreference = req.cookies.sort || "priority";
		const orderPreference = req.cookies.order || "DESC";
		const filterPreference = req.cookies.filter || "";

		const sprintsAll = await db.query("SELECT * from sprints");
		const arraySprints = sprintsAll.rows;

		const currentSprintDetailsResults = await db.query("SELECT * FROM sprints WHERE id = $1", [currentSprint]);
		const currentSprintDetails = currentSprintDetailsResults.rows[0];
		
		const sprintResult = await db.query("SELECT start_date, end_date FROM sprints WHERE id = $1", [currentSprint]);
		const sprint = sprintResult.rows[0];

		let sprintStatus = "Not Started";
		const currentDate = new Date();

		const startDate = new Date(sprint.start_date);
		const endDate = new Date(sprint.end_date);

		if (currentDate >= startDate && currentDate <= endDate) {
			sprintStatus = "In Progress";
		} else if (currentDate > endDate) { 
			sprintStatus = "Completed";
		}
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
			resultNotStarted = await db.query(`SELECT * FROM tasks WHERE status = 'Not Started' AND location = $1 ORDER BY title ${orderPreference}`, [currentSprint]);
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query(`SELECT * FROM tasks WHERE status = 'In Progress' AND location = $1 ORDER BY title ${orderPreference}`, [currentSprint]);
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query(`SELECT * FROM tasks  WHERE status = 'Completed' AND location = $1 ORDER BY title ${orderPreference}`, [currentSprint]);
			completedTasks = resultCompleted.rows;
		// // group the tags together
		} else if (sortPreference === "story_points"){
			// get the tasks from each column
			resultNotStarted = await db.query(`SELECT * FROM tasks WHERE status = 'Not Started' AND location = $1 ORDER BY story_points IS NULL, story_points ${orderPreference}`, [currentSprint]);
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query(`SELECT * FROM tasks WHERE status = 'In Progress' AND location = $1 ORDER BY story_points IS NULL, story_points ${orderPreference}`, [currentSprint]);
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query(`SELECT * FROM tasks  WHERE status = 'Completed' AND location = $1 ORDER BY story_points IS NULL, story_points ${orderPreference}`, [currentSprint]);
			completedTasks = resultCompleted.rows;
		// // sort by priority
		} else if (sortPreference === "priority"){
			// get the tasks from each column
			resultNotStarted = await db.query(`SELECT * FROM tasks WHERE status = 'Not Started' AND location = $1 ORDER BY priority IS NULL, priority ${orderPreference}`, [currentSprint]);
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query(`SELECT * FROM tasks WHERE status = 'In Progress' AND location = $1 ORDER BY priority IS NULL, priority ${orderPreference}`, [currentSprint]);
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query(`SELECT * FROM tasks  WHERE status = 'Completed' AND location = $1 ORDER BY priority IS NULL, priority ${orderPreference}`, [currentSprint]);
			completedTasks = resultCompleted.rows;
		}
		res.render("sprint.ejs", {
			notStarted:notStartedTasks,
			inProgress:inProgressTasks,
			completed:completedTasks,
			view:viewPreference,
			sprintStatus: sprintStatus,
			sprints: arraySprints,
			sprintDetails: currentSprintDetails
		});
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

// change the order (sprint)
app.post("/changeSprintOrder", async (req,res) =>{
    const orderPreference = req.body.order;
    res.cookie('order', orderPreference);
    res.redirect("/viewSprint");
});

// change the filter (sprint)
app.post("/changeSprintFilter", async (req,res) =>{
    const filterPreference = req.body.filter;
    res.cookie('filter', filterPreference);
    res.redirect("/viewSprint");
});

// move a task from the sprint to the product backlog (sprint)
app.post("/moveToBacklog", async (req,res) =>{
	
	const { taskId } = req.body; 

    try {
		const query = "UPDATE tasks SET location = NULL WHERE id = $1";
		await db.query(query, [taskId]);
		res.redirect('/viewSprint');

	} catch (err) {
        console.log(err);
        
    }
});


// move a task from the product backlog to sprint (product backlog)
app.post("/moveToSprint", async (req,res) =>{

	const { taskId, sprintId } = req.body; 
	try {
        await db.query("UPDATE tasks SET location = $1,status = 'Not Started' WHERE id = $2", [sprintId, taskId]);
		res.redirect('/');
   
    } catch (error) {
        console.log("Error moving task:", err);
  }


});

// update which sprint we are currently viewing (sprint)
app.post("/setSprintView", async (req,res) =>{
	const sprintId = req.body.sprintId;
	res.cookie("currentSprintId",sprintId);
	res.redirect("/viewSprint");
});

// edit the details of a sprint (sprint)
app.post("/editSprint", async (req,res) =>{
	try {
        const id = req.cookies.currentSprintId;
	    const newName = (req.body.name === '') ? null : req.body.name;
	    const newDescription = (req.body.description === '') ? null : req.body.description;
		const newProductOwner = (req.body.productOwner === '') ? null : req.body.productOwner;
		const newScrumMaster = (req.body.scrumMaster === '') ? null : req.body.scrumMaster;
		const newStartDate = (req.body.startDate === '') ? null : req.body.startDate;
		const newEndDate = (req.body.endDate === '') ? null : req.body.endDate;
	    await db.query('UPDATE sprints SET name = $2, description = $3, start_date = $4, end_date = $5, scrum_master = $6, product_owner = $7 WHERE id = $1', [id, newName, newDescription, newStartDate, newEndDate, newScrumMaster, newProductOwner]);
        res.redirect("/viewSprint");
	} catch (err) {
		console.log(err);
	} 
});

// delete a sprint (sprint)
app.post("/deleteSprint", async (req,res) =>{
	try {
		const sprintId = req.body.sprintId;
		const deleteQuery = 'DELETE FROM sprints WHERE id = $1';
		await db.query(deleteQuery, [sprintId]);
		res.redirect("/");
	} catch (err) {
		console.log(err);
	} 
});

// edit a task (sprint)
app.post("/editInSprint", async (req,res) => {
	try {
        const id = req.body.id;
	    const newName = req.body.taskName
	    const newDescription = (req.body.taskDescription === '') ? null : req.body.taskDescription
		const newTags = (req.body.taskTag === '') ? null : req.body.taskTags
		const newPriority = (req.body.taskPriority === '') ? null : req.body.taskPriority
		const newStoryPoint = (req.body.taskStoryPoint === '') ? null : req.body.taskStoryPoint
	    await db.query('UPDATE tasks SET title = $2, description = $3, tags = $4, priority = $5, story_points = $6 WHERE id = $1', [id, newName, newDescription, newTags, newPriority, newStoryPoint])
        res.redirect("/viewSprint");
	} catch (err) {
		console.log(err);
	} 

});


// view a burndown chart (sprint)
app.post("/viewBurndownChart", async (req,res) =>{

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

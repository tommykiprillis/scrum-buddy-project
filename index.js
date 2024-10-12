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

		const errorMessage = req.cookies.error;
		res.clearCookie("error");
		// get view and sort preference of the user
        const viewPreference = req.cookies.view || "card";
		const sortPreference = req.cookies.sort || "priority";
		const orderPreference = req.cookies.order || "DESC";
		const filterPreference = req.cookies.filter || "";
		
		
        // get the tasks from each column
		let result;
		let backlogTasks;

		const sprintsResult = await db.query("SELECT * from sprints");
		const backlogSprints = sprintsResult.rows;

        let query = "SELECT * FROM tasks WHERE location	 IS NULL"
        query += (filterPreference !== "") ? ` AND ('${filterPreference}' = ANY(tags))` : "";

		const fromSprintTasksResult = await db.query(`${query} AND "from_sprint" = true`);
    	const fromSprintTasksArr = fromSprintTasksResult.rows;

		// sort by alphabetical order
		if (sortPreference === "name"){
            query += ` ORDER BY title ${orderPreference}`;
			// get the tasks from each column
			result = await db.query(query);
			backlogTasks = result.rows;
		// // group the tags together
		} else if (sortPreference === "story_points"){
            query += ` ORDER BY story_points IS NULL, story_points ${orderPreference}`;
			// get the tasks from each column
			result = await db.query(query);
			backlogTasks = result.rows;
		// // sort by priority
		} else if (sortPreference === "priority"){
            query += ` ORDER BY priority IS NULL, priority ${orderPreference}`
			// get the tasks from each column
			result = await db.query(query);
			backlogTasks = result.rows;
		}

        // get the current date
        const currentDateObject = new Date();
        let currentDate = "";
        currentDate += currentDateObject.getFullYear();
        currentDate += "-";
        currentDate += (((currentDateObject.getMonth() < 9)? "0" : "") +  (currentDateObject.getMonth() + 1));
        currentDate += "-";
        currentDate += (((currentDateObject.getDate() < 10)? "0" : "") +  currentDateObject.getDate());

		// render the page and pass error message if it exists
		const renderOptions = {tasks: backlogTasks, fromSprintTasks: fromSprintTasksArr, sprints: backlogSprints, view:viewPreference, sort: sortPreference, filter: filterPreference, order: orderPreference, date: currentDate};
		if (errorMessage) {
			renderOptions.error = errorMessage;
		}
		res.render("index.ejs", renderOptions);
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

// change the order (product backlog)
app.post("/changeOrder", async (req,res) =>{
    const orderPreference = req.body.order;
    res.cookie('order', orderPreference);
    res.redirect("/");
});

// change the filter (product backlog)
app.post("/changeFilter", async (req,res) =>{
    const filterPreference = req.body.filter;
    res.cookie('filter', filterPreference);
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
		// Set sprint status to "Not Started" initially
		const result = await db.query(
			"INSERT INTO sprints (name, start_date, end_date, sprint_status) VALUES ($1, $2, $3, 'Not Started') RETURNING id",
			[sprintName, sprintStartDate, sprintEndDate]
		  );
		
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

		const errorMessage = req.cookies.error;
		res.clearCookie("error");
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
		const sprintStatus = currentSprintDetails.sprint_status;
		const currentDate = new Date();
		const startDate = new Date(currentSprintDetails.start_date);
    	const endDate = new Date(currentSprintDetails.end_date);

		// Check for conditions to start/complete sprint
		let displayStartButton = false;
		let displayCompleteButton = false;

		// If the current date is the start date, display the start sprint button
		if (currentDate.toDateString() === startDate.toDateString() && sprintStatus === "Not Started") {
			displayStartButton = true;
		  }

		// Check if all tasks are completed
		const allTasksCompleted = (await db.query("SELECT COUNT(*) FROM tasks WHERE location = $1 AND status != 'Completed'", [currentSprint])).rows[0].count === '0';

		// If all tasks are completed, show the complete sprint button before due date
		if (((currentDate <= endDate && allTasksCompleted) || (currentDate.toDateString() === endDate.toDateString())) && sprintStatus === "In Progress") {
			displayCompleteButton = true;
		}

		// Automatically complete sprint if the current date is past the due date
        if (currentDate > endDate && sprintStatus === "In Progress") {
            return res.redirect('/completeSprint');
        }

        // get the tasks from each column
		let resultNotStarted;
		let notStartedTasks;

		let resultInProgress;
		let inProgressTasks;

		let resultCompleted;
		let completedTasks;
		
        let query = "SELECT * FROM tasks WHERE ";
        query += (filterPreference !== "") ? `('${filterPreference}' = ANY(tags)) AND ` : "";
		// sort by alphabetical order
		if (sortPreference === "name"){
			// get the tasks from each column
			resultNotStarted = await db.query(query + `status = 'Not Started' AND location = $1 ORDER BY title ${orderPreference}`, [currentSprint]);
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query(query + `status = 'In Progress' AND location = $1 ORDER BY title ${orderPreference}`, [currentSprint]);
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query(query + `status = 'Completed' AND location = $1 ORDER BY title ${orderPreference}`, [currentSprint]);
			completedTasks = resultCompleted.rows;
		// // group the tags together
		} else if (sortPreference === "story_points"){
			// get the tasks from each column
			resultNotStarted = await db.query(query + `status = 'Not Started' AND location = $1 ORDER BY story_points IS NULL, story_points ${orderPreference}`, [currentSprint]);
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query(query + `status = 'In Progress' AND location = $1 ORDER BY story_points IS NULL, story_points ${orderPreference}`, [currentSprint]);
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query(query + `status = 'Completed' AND location = $1 ORDER BY story_points IS NULL, story_points ${orderPreference}`, [currentSprint]);
			completedTasks = resultCompleted.rows;
		// // sort by priority
		} else if (sortPreference === "priority"){
			// get the tasks from each column
			resultNotStarted = await db.query(query + `status = 'Not Started' AND location = $1 ORDER BY priority IS NULL, priority ${orderPreference}`, [currentSprint]);
			notStartedTasks = resultNotStarted.rows;

			resultInProgress = await db.query(query + `status = 'In Progress' AND location = $1 ORDER BY priority IS NULL, priority ${orderPreference}`, [currentSprint]);
			inProgressTasks = resultInProgress.rows;

			resultCompleted = await db.query(query + `status = 'Completed' AND location = $1 ORDER BY priority IS NULL, priority ${orderPreference}`, [currentSprint]);
			completedTasks = resultCompleted.rows;
		}

		// get the current date
		const currentDateObject = new Date();
		let currentDate1 = "";
		currentDate1 += currentDateObject.getFullYear();
		currentDate1 += "-";
		currentDate1 += (((currentDateObject.getMonth() < 9)? "0" : "") +  (currentDateObject.getMonth() + 1));
		currentDate1 += "-";
		currentDate1 += (((currentDateObject.getDate() < 10)? "0" : "") +  currentDateObject.getDate());


		const renderOptions = {
			notStarted: resultNotStarted.rows,
			inProgress: resultInProgress.rows,
			completed: resultCompleted.rows,
			view: viewPreference,
			sprintStatus: sprintStatus,
			sprints: arraySprints,
			sprintDetails: currentSprintDetails,
			sort: sortPreference,
			filter: filterPreference,
			order: orderPreference,
			date: currentDate1
		};

		if (errorMessage) {
			renderOptions.error = errorMessage;
		}
		if (displayStartButton){
			renderOptions.displayStartButton = true;
		}
		if (displayCompleteButton){
			renderOptions.displayCompleteButton = true;
		}
		res.render("sprint.ejs", renderOptions);
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
		const query = "UPDATE tasks SET location = NULL,date_completed = NULL WHERE id = $1";
		await db.query(query, [taskId]);
		res.redirect('/viewSprint');

	} catch (err) {
        console.log(err);
        
    }
});


// move a task from the product backlog to sprint (product backlog)
app.post("/moveToSprint", async (req, res) => {
    const { taskId, sprintId } = req.body; 
    try {
        
        const taskResult = await db.query("SELECT story_points FROM tasks WHERE id = $1", [taskId]);
		const sprintResult = await db.query("SELECT sprint_status FROM sprints WHERE id = $1", [sprintId]);

        if (taskResult.rows.length === 0 || taskResult.rows[0].story_points === null) {
			res.cookie("error", "Task must have story points.");
        } else if (sprintResult.rows.length === 0 || sprintResult.rows[0].sprint_status !== "Not Started") {
			res.cookie("error", "Sprint in progress or completed. Can't add task");
        } else {
			await db.query("UPDATE tasks SET location = $1, status = 'Not Started' WHERE id = $2", [sprintId, taskId]);
		}
        res.redirect('/');

    } catch (error) {
        console.log("Error moving task:", error);
        res.status(400).send(error.message); 
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
		const moveTaskToBacklog = "UPDATE tasks SET location = NULL,date_completed = NULL, assignee = NULL WHERE location = $1";
		await db.query(moveTaskToBacklog, [sprintId]);
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
		const newStage = (req.body.taskStage === '') ? null : req.body.taskStage
		const newAssignee = (req.body.taskAssignee === '') ? null : req.body.taskAssignee;
		await db.query('UPDATE tasks SET title = $2, description = $3, tags = $4, priority = $5, story_points = $6, assignee = $7, stage = $8 WHERE id = $1', [id, newName, newDescription, newTags, newPriority, newStoryPoint, newAssignee,newStage])
		res.redirect("/viewSprint");
        
	} catch (err) {
		console.log(err);
	} 

});


// view a burndown chart (sprint)
app.get("/viewBurndownChart", async (req, res) => {
	try {
        // get sprint ID from the cookies
		const sprintId = req.cookies.currentSprintId;

		const sprintsAll = await db.query("SELECT * from sprints");
		const arraySprints = sprintsAll.rows;

		const currentSprintDetailsResults = await db.query("SELECT * FROM sprints WHERE id = $1", [sprintId]);
		const currentSprintDetails = currentSprintDetailsResults.rows[0];
		const sprintStatus = currentSprintDetails.sprint_status;
		const currentDate1 = new Date();
		const startDate = new Date(currentSprintDetails.start_date);
    	const endDate1 = new Date(currentSprintDetails.end_date);

		// Check for conditions to start/complete sprint
		let displayStartButton = false;
		let displayCompleteButton = false;

		// If the current date is the start date, display the start sprint button
		if (currentDate1.toDateString() === startDate.toDateString() && sprintStatus === "Not Started") {
			displayStartButton = true;
		  }

		// Check if all tasks are completed
		const allTasksCompleted = (await db.query("SELECT COUNT(*) FROM tasks WHERE location = $1 AND status != 'Completed'", [sprintId])).rows[0].count === '0';

		// If all tasks are completed, show the complete sprint button before due date
		if (((currentDate1 <= endDate1 && allTasksCompleted) || (currentDate1.toDateString() === endDate1.toDateString())) && sprintStatus === "In Progress") {
			displayCompleteButton = true;
		}

		// Automatically complete sprint if the current date is past the due date
        if (currentDate1 > endDate1 && sprintStatus === "In Progress") {
            return res.redirect('/completeSprint');
        }

		// HEREHREHRHERH
		// get the sprint details (start and end date)
		const sprintResult = await db.query(
			"SELECT start_date, end_date FROM sprints WHERE id = $1", [sprintId]
		);
		const sprint = sprintResult.rows[0];
		const { start_date: sprintStartDate, end_date: sprintEndDate } = sprint;

		// get the total story points for the sprint tasks
		const totalStoryPointsResult = await db.query(
			"SELECT SUM(story_points) AS total_story_points FROM tasks WHERE location = $1", [sprintId]
		);
		const totalStoryPoints = totalStoryPointsResult.rows[0].total_story_points || 0;

		// get task completion data
		const taskCompletionResult = await db.query(
			"SELECT date_completed, story_points FROM tasks WHERE location = $1 AND date_completed IS NOT NULL", [sprintId]
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


		// Send the burndown data to burndown.ejs
		res.render("burndown.ejs", {
			actualBurndownData: JSON.stringify(filteredActualData),
			idealBurndownData: JSON.stringify(idealBurndownData),
			sprintId: sprintId,
            sprints: arraySprints,
            sprintStatus:sprintStatus,
            sprintDetails:currentSprintDetails,
			date: currentDate1,
			displayStartButton: (displayStartButton === true)?true:null,
			displayCompleteButton: (displayCompleteButton === true)?true:null,
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
		if (newTaskProgress === "In Progress" || newTaskProgress === "Completed"){
			const taskAssigneeResult = await db.query('SELECT assignee FROM tasks WHERE id = $1', [taskID]);
			const taskAssignee = taskAssigneeResult.rows[0]?.assignee;
			if (taskAssignee === null){
				res.cookie("error", "Task must have an assignee before moving.");
				return res.redirect("/viewSprint");
			}
		}
        if (newTaskProgress === "Completed"){
            // if the task is moved to completed, save the day that it was completed
            const currentDate = new Date();
            await db.query('UPDATE tasks SET status = $2,date_completed = $3 WHERE id = $1', [taskID, newTaskProgress,currentDate])
        } else {
            await db.query('UPDATE tasks SET status = $2,date_completed = NULL WHERE id = $1', [taskID, newTaskProgress])
        }
        if (newTaskProgress === "Completed" || newTaskProgress === "Not Started") {
            await db.query('UPDATE tasks SET stage = null')
        }
        res.redirect("/viewSprint");
    } catch (err) {
        console.log(err);
    } 
});


// complete the sprint, moving tasks 'in progress' back to the product backlog, leaving completed tasks in the sprint backlog
app.post("/completeSprint", async (req,res) =>{
	const sprintId = req.cookies.currentSprintId;
	
	try {
		// set the status of the sprint to 'Completed'
		await db.query("UPDATE sprints SET sprint_status = 'Completed' WHERE id = $1", [sprintId]);
		// move tasks 'Not Started' back to the backlog
		await db.query("UPDATE tasks SET location = NULL WHERE location = $1 AND status = 'Not Started'", [sprintId]);
		// move tasks 'In Progress' back to the backlog, tagging 'from_sprint'
		await db.query("UPDATE tasks SET location = NULL, from_sprint = TRUE WHERE location = $1 AND status = 'In Progress'", [sprintId]);
        // update the end date to the current date
        const currentDate = new Date();
        await db.query("UPDATE sprints SET end_date = $1 WHERE id = $2", [currentDate,sprintId]);

		res.redirect('/viewSprint')
	} catch (err) {
		console.log("Error completing the sprint: ", err);
	}

})

app.post("/startSprint", async (req, res) => {
	try {
		const sprintId = req.cookies.currentSprintId;

		// get sprint details
		const sprintDetailsResult = await db.query("SELECT * FROM sprints WHERE id = $1", [sprintId]);
        const sprintDetails = sprintDetailsResult.rows[0];

		// check for Scrum Master and Product Owner
		if (!sprintDetails.scrum_master|| !sprintDetails.product_owner) {
			res.cookie("error", "Sprint must have a Scrum Master and a Product Owner.");
			return res.redirect("/viewSprint");
		}

		// check for tasks
		const tasksResult = await db.query("SELECT * FROM tasks WHERE location = $1", [sprintId]);
		if (tasksResult.rows.length === 0) {
			res.cookie("error", "Sprint must have tasks assigned.");
			return res.redirect("/viewSprint");
		}

		// update sprint status to "In Progress"
		await db.query("UPDATE sprints SET sprint_status = 'In Progress' WHERE id = $1", [sprintId]);
		
		// redirect to the sprint page
		res.redirect("/viewSprint");
		
	} catch (err) {
		console.log(err);
		res.cookie("error", "An error occurred while starting the sprint.");
		res.redirect("/viewSprint");
	}
});


// starts the application
app.listen(port, () => {
  	console.log(`Server running on port ${port}`);
});

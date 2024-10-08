-- creating the types
CREATE TYPE tag as ENUM ('Front-End','Back-End','API','Databases','Testing','UI/UX');
CREATE TYPE priority as ENUM ('Low','Medium','Important','Urgent');
CREATE TYPE status as ENUM ('Not Started','In Progress','Completed');
CREATE TYPE stage as ENUM ('Integration','In Development','In Testing','In Planning');

-- creating the table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    tag tag,
    priority priority,
    status status,
    stage stage,
    story_points INT,
    accumulated_time INT
);

-- add a user column
ALTER TABLE tasks ADD assignee text;

-- alter description to not be NOT NULL
ALTER TABLE tasks DROP COLUMN description;
ALTER TABLE tasks ADD description text;

--NOTE: change UI/UX -> UIUX
ALTER TYPE tag RENAME VALUE 'UI/UX' TO 'UIUX';

-- add location and date complete columns
ALTER TABLE tasks ADD location int;
ALTER TABLE tasks ADD date_completed DATE;

-- create sprint table
CREATE TABLE sprints (
    id SERIAL PRIMARY KEY,
    name text NOT NULL,
    description text,
    start_date DATE,
    end_date DATE,
    scrum_master text,
    product_owner text
);

-- change the tags column to allow for multiple tags
ALTER TABLE tasks DROP COLUMN tag;
ALTER TABLE tasks ADD tags tag[];

-- add a sprintStatus column
ALTER TABLE sprints ADD sprint_status status;
-- add fromSprint column
ALTER table tasks ADD from_sprint boolean;




-- create sprint table
CREATE TABLE tasklog (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL,  
    date DATE NOT NULL DEFAULT CURRENT_DATE, 
    hours DECIMAL(5,2) NOT NULL, 
    user_id INT NOT NULL, 
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)  


);

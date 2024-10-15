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

-- change stage tag names
ALTER TYPE stage RENAME VALUE 'In Planning' TO 'Planning';
ALTER TYPE stage RENAME VALUE 'In Development' TO 'Development';
ALTER TYPE stage RENAME VALUE 'In Testing' TO 'Testing';

-- user table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    is_admin boolean,
    is_available boolean,
    name text,
    email text,
    password text,
    sprint_id int
);

-- tasklog table
CREATE TABLE tasklogs (
    task_id int,
    user_id int,
    date date,
    hours int
);
-- changelog table
CREATE TABLE changelogs (
    task_id int,
    user_id int,
    date date,
    description text
);

-- adding id columns to tasklogs and changelogs
ALTER TABLE tasklogs ADD id SERIAL PRIMARY KEY;
ALTER TABLE changelogs ADD id SERIAL PRIMARY KEY;

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
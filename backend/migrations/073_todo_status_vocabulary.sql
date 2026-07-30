-- One vocabulary for a todo's status, enforced where it cannot drift.
--
-- Every piece of code agreed on pending/in_progress/done: the column default,
-- the toggle handler, the create form and the counts on the page. The data did
-- not — three rows said 'todo', which matched nothing. The symptom was not an
-- error: `statusColors[item.status]` was `undefined`, so the class attribute
-- rendered as the literal string "undefined" and the control lost its colour
-- and its label while continuing to work.
--
-- A default and a handler are not a constraint. Anything that can write the
-- column will eventually write something else, so the check goes on the table.

UPDATE todos SET status = 'pending'
 WHERE status NOT IN ('pending', 'in_progress', 'done');

DO $$
BEGIN
    ALTER TABLE todos
        ADD CONSTRAINT todos_status_known
        CHECK (status IN ('pending', 'in_progress', 'done'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Same story, same fix: the priority pill falls back to `medium` in the page,
-- which quietly hides a bad value rather than preventing one.
UPDATE todos SET priority = 'medium'
 WHERE priority NOT IN ('low', 'medium', 'high');

DO $$
BEGIN
    ALTER TABLE todos
        ADD CONSTRAINT todos_priority_known
        CHECK (priority IN ('low', 'medium', 'high'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

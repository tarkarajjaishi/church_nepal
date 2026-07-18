-- Volunteer scheduling tables
CREATE TABLE IF NOT EXISTS volunteer_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    enabled BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS volunteer_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES volunteer_teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL DEFAULT '',
    slots INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_team ON volunteer_shifts(team_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_date ON volunteer_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_date_range ON volunteer_shifts(shift_date, start_time);

CREATE TABLE IF NOT EXISTS volunteer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES volunteer_shifts(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'assigned', -- assigned, confirmed, completed
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_shift ON volunteer_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_assignments_person ON volunteer_assignments(person_id);

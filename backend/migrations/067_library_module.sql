-- Church Library module.
--
-- Deliberately absent: an `available_copies` counter on the book.
--
-- A mutable counter is the classic way two people borrow the last copy of a
-- book: both read "1 available", both decrement, and the shelf is short. Copies
-- are individual rows instead, a loan points at one specific copy, and a
-- partial unique index makes lending the same copy twice impossible at the
-- database. Availability is then simply "copies with no open loan" — derived,
-- never stored, and never wrong.
--
-- It also matches how a library actually works: copy 2 of 3 can be damaged,
-- barcodes are per-copy, and "who has copy 2" is a real question.

-- ---------------------------------------------------------------------------
-- Categories (the study-material taxonomy from the spec)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(160) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon VARCHAR(60) NOT NULL DEFAULT 'BookMarked',
    color VARCHAR(20) NOT NULL DEFAULT '#0b3c5d',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_library_categories_slug ON library_categories(slug);

-- ---------------------------------------------------------------------------
-- Authors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    photo TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_authors_name ON authors(lower(name));

-- ---------------------------------------------------------------------------
-- Books — the work, not the physical object
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500) NOT NULL DEFAULT '',
    isbn VARCHAR(20) NOT NULL DEFAULT '',
    publisher VARCHAR(255) NOT NULL DEFAULT '',
    edition VARCHAR(80) NOT NULL DEFAULT '',
    language VARCHAR(80) NOT NULL DEFAULT 'English',
    category_id UUID REFERENCES library_categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    keywords TEXT NOT NULL DEFAULT '',
    pages INTEGER,
    publication_year INTEGER,
    cover_url TEXT NOT NULL DEFAULT '',

    -- Digital material (video course, PDF, audio lesson) has no physical copy
    -- and is never lent — it is always "available".
    -- book | ebook | video | audio | document | manual
    material_kind VARCHAR(30) NOT NULL DEFAULT 'book',
    digital_url TEXT NOT NULL DEFAULT '',

    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT books_pages_positive CHECK (pages IS NULL OR pages > 0)
);
-- ISBN identifies a work; blank is common for local material and must not clash.
CREATE UNIQUE INDEX IF NOT EXISTS uq_library_books_isbn
    ON library_books(isbn) WHERE isbn <> '';
CREATE INDEX IF NOT EXISTS idx_library_books_category ON library_books(category_id);
CREATE INDEX IF NOT EXISTS idx_library_books_kind ON library_books(material_kind);
CREATE INDEX IF NOT EXISTS idx_library_books_title ON library_books(lower(title));

CREATE TABLE IF NOT EXISTS book_authors (
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (book_id, author_id)
);

-- ---------------------------------------------------------------------------
-- Physical copies
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    copy_code VARCHAR(50) NOT NULL,
    shelf VARCHAR(80) NOT NULL DEFAULT '',
    location VARCHAR(160) NOT NULL DEFAULT '',
    -- excellent | good | fair | poor | damaged
    condition VARCHAR(20) NOT NULL DEFAULT 'good',
    acquired_on DATE,
    purchase_cost BIGINT NOT NULL DEFAULT 0,
    -- in_circulation | withdrawn | lost | damaged
    status VARCHAR(20) NOT NULL DEFAULT 'in_circulation',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT copies_cost_non_negative CHECK (purchase_cost >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_book_copies_code ON book_copies(copy_code);
CREATE INDEX IF NOT EXISTS idx_book_copies_book ON book_copies(book_id, status);

INSERT INTO receipt_sequences (scope, prefix, next_value, padding)
VALUES ('library_copy', 'LIB', 1, 5)
ON CONFLICT (scope) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Loans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    copy_id UUID NOT NULL REFERENCES book_copies(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    borrower_name VARCHAR(255) NOT NULL DEFAULT '',
    borrower_contact VARCHAR(255) NOT NULL DEFAULT '',
    borrowed_on DATE NOT NULL DEFAULT CURRENT_DATE,
    due_on DATE NOT NULL,
    returned_on DATE,
    renewals INTEGER NOT NULL DEFAULT 0,
    condition_out VARCHAR(20) NOT NULL DEFAULT 'good',
    condition_in VARCHAR(20),
    -- Assessed on return and then fixed: an accruing figure is computed for
    -- open loans, but once a fee is charged it is a real debt and must not
    -- drift because someone changed the daily rate afterwards.
    fee_assessed BIGINT NOT NULL DEFAULT 0,
    fee_paid BIGINT NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    issued_by VARCHAR(255) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT loans_due_after_borrowed CHECK (due_on >= borrowed_on),
    CONSTRAINT loans_renewals_non_negative CHECK (renewals >= 0),
    CONSTRAINT loans_fee_non_negative CHECK (fee_assessed >= 0 AND fee_paid >= 0)
);
CREATE INDEX IF NOT EXISTS idx_book_loans_copy ON book_loans(copy_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_person ON book_loans(person_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_due ON book_loans(due_on) WHERE returned_on IS NULL;

-- This is what makes lending safe. One open loan per physical copy, enforced
-- by the database, so two simultaneous checkouts of the last copy cannot both
-- succeed no matter how the handler is written.
CREATE UNIQUE INDEX IF NOT EXISTS uq_book_copy_on_loan
    ON book_loans(copy_id) WHERE returned_on IS NULL;

-- ---------------------------------------------------------------------------
-- Holds — the queue when every copy is out
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS book_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    requester_name VARCHAR(255) NOT NULL DEFAULT '',
    requester_contact VARCHAR(255) NOT NULL DEFAULT '',
    -- waiting | ready | fulfilled | cancelled | expired
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    notified_on DATE,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_book_holds_book ON book_holds(book_id, status);
-- The same person may not queue twice for the same title while still waiting.
CREATE UNIQUE INDEX IF NOT EXISTS uq_book_holds_active
    ON book_holds(book_id, lower(requester_name))
    WHERE status IN ('waiting', 'ready');

-- ---------------------------------------------------------------------------
-- Settings — one row, so loan rules are configurable per church
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    loan_days INTEGER NOT NULL DEFAULT 14,
    max_renewals INTEGER NOT NULL DEFAULT 2,
    renewal_days INTEGER NOT NULL DEFAULT 14,
    -- Minor units per day overdue. 0 means the church charges nothing, which
    -- is the common case and why fees are optional in the spec.
    daily_fee BIGINT NOT NULL DEFAULT 0,
    max_fee BIGINT NOT NULL DEFAULT 0,
    max_loans_per_person INTEGER NOT NULL DEFAULT 3,
    hold_days INTEGER NOT NULL DEFAULT 3,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT settings_single_row CHECK (id = 1),
    CONSTRAINT settings_sane CHECK (
        loan_days > 0 AND max_renewals >= 0 AND renewal_days > 0
        AND daily_fee >= 0 AND max_fee >= 0 AND max_loans_per_person > 0
    )
);
INSERT INTO library_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed the category list from the spec
-- ---------------------------------------------------------------------------
INSERT INTO library_categories (name, slug, icon, color, sort_order) VALUES
    ('Bible Study',       'bible-study',       'BookOpen',      '#0b3c5d', 10),
    ('Leadership',        'leadership',        'Users',         '#1f6f8b', 20),
    ('Youth',             'youth',             'Users',         '#ea580c', 30),
    ('Children',          'children',          'Baby',          '#16a34a', 40),
    ('Marriage & Family', 'marriage-family',   'Heart',         '#db2777', 50),
    ('Prayer',            'prayer',            'HandHeart',     '#7c3aed', 60),
    ('Discipleship',      'discipleship',      'Footprints',    '#0891b2', 70),
    ('Evangelism',        'evangelism',        'Megaphone',     '#d4a017', 80),
    ('Mission',           'mission',           'Globe',         '#0f766e', 90),
    ('Small Groups',      'small-groups',      'Users',         '#2563eb', 100),
    ('Training Manuals',  'training-manuals',  'FileText',      '#64748b', 110),
    ('Theology',          'theology',          'BookMarked',    '#4f46e5', 120),
    ('Biography',         'biography',         'User',          '#b91c1c', 130),
    ('Devotional',        'devotional',        'Sunrise',       '#f59e0b', 140),
    ('Counselling',       'counselling',       'MessageCircle', '#0284c7', 150),
    ('Church History',    'church-history',    'Landmark',      '#78716c', 160)
ON CONFLICT (slug) DO NOTHING;

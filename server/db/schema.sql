PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ─── M1: Users & Roles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('student','warden','admin','sysadmin','accounts')),
    avatar_url  TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── M2: Students ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL UNIQUE REFERENCES users(id),
    reg_no          TEXT NOT NULL UNIQUE,
    department      TEXT NOT NULL,
    year            INTEGER NOT NULL CHECK(year BETWEEN 1 AND 5),
    phone           TEXT,
    dob             DATE,
    gender          TEXT CHECK(gender IN ('Male','Female','Other')),
    guardian_name   TEXT,
    guardian_phone  TEXT,
    address         TEXT,
    admission_date  DATE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Hostels ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    type        TEXT NOT NULL CHECK(type IN ('Boys','Girls')),
    total_rooms INTEGER NOT NULL DEFAULT 0,
    warden_id   INTEGER REFERENCES users(id),
    address     TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── M3: Rooms ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    hostel_id   INTEGER NOT NULL REFERENCES hostels(id),
    room_number TEXT NOT NULL,
    floor       INTEGER NOT NULL DEFAULT 0,
    type        TEXT NOT NULL CHECK(type IN ('Single','Double','Triple')) DEFAULT 'Double',
    capacity    INTEGER NOT NULL DEFAULT 2,
    status      TEXT NOT NULL CHECK(status IN ('Available','Occupied','Partial','Maintenance')) DEFAULT 'Available',
    amenities   TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hostel_id, room_number)
);

-- ─── M3: Room Allocations ───────────────────────────────────
CREATE TABLE IF NOT EXISTS room_allocations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id      INTEGER NOT NULL REFERENCES students(id),
    room_id         INTEGER NOT NULL REFERENCES rooms(id),
    academic_year   TEXT NOT NULL,
    alloc_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    vacate_date     DATE,
    status          TEXT NOT NULL CHECK(status IN ('Active','Vacated','Transferred')) DEFAULT 'Active',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── M4: Fee Types ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_types (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    amount      REAL NOT NULL,
    frequency   TEXT NOT NULL CHECK(frequency IN ('One-Time','Monthly','Semester','Annual')),
    description TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1
);

-- ─── M4: Fee Payments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_payments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id      INTEGER NOT NULL REFERENCES students(id),
    fee_type_id     INTEGER NOT NULL REFERENCES fee_types(id),
    amount          REAL NOT NULL,
    due_date        DATE,
    paid_date       DATE,
    method          TEXT CHECK(method IN ('Online','Cash','Cheque','UPI','Bank Transfer')),
    status          TEXT NOT NULL CHECK(status IN ('Pending','Paid','Overdue','Waived')) DEFAULT 'Pending',
    txn_ref         TEXT,
    receipt_no      TEXT,
    remarks         TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── M5: Maintenance Requests ───────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id      INTEGER NOT NULL REFERENCES students(id),
    room_id         INTEGER NOT NULL REFERENCES rooms(id),
    category        TEXT NOT NULL CHECK(category IN ('Electrical','Plumbing','Furniture','Cleaning','Internet','AC/Fan','Other')),
    description     TEXT NOT NULL,
    priority        TEXT NOT NULL CHECK(priority IN ('Low','Medium','High','Urgent')) DEFAULT 'Medium',
    status          TEXT NOT NULL CHECK(status IN ('Submitted','In Progress','Resolved','Closed','Rejected')) DEFAULT 'Submitted',
    assigned_to     TEXT,
    resolution_note TEXT,
    submitted_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at     DATETIME,
    closed_at       DATETIME
);

-- ─── M7: Disciplinary Records ───────────────────────────────
CREATE TABLE IF NOT EXISTS disciplinary_records (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id      INTEGER NOT NULL REFERENCES students(id),
    incident_date   DATE NOT NULL,
    category        TEXT NOT NULL CHECK(category IN ('Noise','Property Damage','Unauthorized Guest','Curfew Violation','Substance Abuse','Ragging','Other')),
    description     TEXT NOT NULL,
    severity        TEXT NOT NULL CHECK(severity IN ('Minor','Moderate','Major','Critical')),
    action_taken    TEXT CHECK(action_taken IN ('Warning','Fine','Suspension','Expulsion','Counseling','Community Service')),
    fine_amount     REAL DEFAULT 0,
    reported_by     INTEGER REFERENCES users(id),
    status          TEXT NOT NULL CHECK(status IN ('Open','Under Review','Action Taken','Closed')) DEFAULT 'Open',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── M9: Notifications ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id),
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('Fee Due','Maintenance','Announcement','Alert','System','Welcome')),
    is_read     INTEGER NOT NULL DEFAULT 0,
    link        TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── M10: Admin Configuration ───────────────────────────────
CREATE TABLE IF NOT EXISTS admin_config (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    key         TEXT NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    category    TEXT NOT NULL CHECK(category IN ('General','Academic','Fees','Hostel','Notification','System')),
    label       TEXT,
    description TEXT,
    updated_by  INTEGER REFERENCES users(id),
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Audit Log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id),
    action      TEXT NOT NULL,
    entity      TEXT NOT NULL,
    entity_id   INTEGER,
    details     TEXT,
    ip_address  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_alloc_student ON room_allocations(student_id);
CREATE INDEX IF NOT EXISTS idx_alloc_room ON room_allocations(room_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_maint_student ON maintenance_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_disc_student ON disciplinary_records(student_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);

```sql
-- New Queries

-- 1) Department (create without manager FK to avoid circular dependency)
CREATE TABLE Department (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_name VARCHAR(100),
    manager_id INT,                -- will add FK later
    email VARCHAR(100) UNIQUE,
    location VARCHAR(150)
);

-- 2) Employee
CREATE TABLE Employee (
    emp_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    DOB DATE,
    gender VARCHAR(10),
    salary DECIMAL(10,2),
    job_title VARCHAR(50),
    contact VARCHAR(15),
    address VARCHAR(255),
    dept_id INT,                   -- FK -> Department
    status VARCHAR(20),
    CONSTRAINT fk_employee_dept FOREIGN KEY (dept_id)
        REFERENCES Department(dept_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- 3) Vehicle
CREATE TABLE Vehicle (
    vehicle_id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_no VARCHAR(20) UNIQUE,
    dept_id INT,                   -- FK -> Department
    vehicle_type VARCHAR(50),
    capacity INT,
    serving_from DATE,
    status ENUM('Available','In Use','In Maintenance') DEFAULT 'Available',
    CONSTRAINT fk_vehicle_dept FOREIGN KEY (dept_id)
        REFERENCES Department(dept_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- 4) Route
CREATE TABLE Route (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(120),
    from_loc VARCHAR(100),
    to_loc VARCHAR(100),
    location VARCHAR(150),         -- optional single-location field if needed
    distance DECIMAL(6,2),
    estimated_dur TIME,
    fare DECIMAL(8,2)
);

-- 5) Assigned_To (relationship with attributes)
CREATE TABLE Assigned_To (
    assign_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    route_id INT,                  -- optional link to route for this assignment
    departure_from VARCHAR(100),
    assign_date DATE DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_assigned_emp FOREIGN KEY (emp_id)
        REFERENCES Employee(emp_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_assigned_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES Vehicle(vehicle_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_assigned_route FOREIGN KEY (route_id)
        REFERENCES Route(route_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- 6) Serves (Vehicle <-> Route) M:N bridge table
CREATE TABLE Serves (
    vehicle_id INT NOT NULL,
    route_id INT NOT NULL,
    PRIMARY KEY (vehicle_id, route_id),
    CONSTRAINT fk_serves_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES Vehicle(vehicle_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_serves_route FOREIGN KEY (route_id)
        REFERENCES Route(route_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- 7) Waste_Record (waste collected per route / run)
CREATE TABLE Waste_Record (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    waste_type VARCHAR(50),
    weight_kg DECIMAL(8,2),
    collection_date DATE DEFAULT (CURRENT_DATE),
    processed_status ENUM('Pending','In Transit','Processed') DEFAULT 'Pending',
    CONSTRAINT fk_waste_route FOREIGN KEY (route_id)
        REFERENCES Route(route_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- 8) Complaints
CREATE TABLE Complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(15),
    location VARCHAR(150),
    description TEXT,
    route_id INT,                  -- optional link to Route
    assigned_emp INT,              -- optional link to the Employee handling it
    status ENUM('Open','In Progress','Resolved') DEFAULT 'Open',
    complaint_date DATE DEFAULT (CURRENT_DATE),
    CONSTRAINT fk_complaint_route FOREIGN KEY (route_id)
        REFERENCES Route(route_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_complaint_emp FOREIGN KEY (assigned_emp)
        REFERENCES Employee(emp_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- 9) Now add the manager_id FK in Department (Employee exists now)
ALTER TABLE Department
ADD CONSTRAINT uq_department_manager UNIQUE (manager_id);

ALTER TABLE Department
ADD CONSTRAINT fk_department_manager
FOREIGN KEY (manager_id) REFERENCES Employee(emp_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

show tables;


 MySQL  localhost:3306 ssl  waste_track  SQL > ALTER TABLE Employee
                                            -> ADD COLUMN email VARCHAR(100) UNIQUE,
                                            -> ADD COLUMN password VARCHAR(255),
                                            -> ADD COLUMN role ENUM('Manager', 'Employee') DEFAULT 'Employee';
Query OK, 0 rows affected (0.5966 sec)

Records: 0  Duplicates: 0  Warnings: 0
 MySQL  localhost:3306 ssl  waste_track  SQL > ALTER TABLE Complaints
                                            -> ADD COLUMN dept_id INT,
                                            -> ADD CONSTRAINT fk_complaint_dept
                                            ->   FOREIGN KEY (dept_id)
                                            ->   REFERENCES Department(dept_id)
                                            ->   ON UPDATE CASCADE
                                            ->   ON DELETE SET NULL;
Query OK, 1 row affected (0.1512 sec)

Records: 1  Duplicates: 0  Warnings: 0

 MySQL  localhost:3306 ssl  waste_track  SQL > UPDATE Employee
                                            -> SET role = 'Manager'
                                            -> WHERE email = 'manager@gmail.com';
Query OK, 1 row affected (0.0880 sec)

Rows matched: 1  Changed: 1  Warnings: 0
 MySQL  localhost:3306 ssl  waste_track  SQL > -- 1. View for pending complaints (for stats page)
Query OK, 0 rows affected (0.0385 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL > CREATE VIEW v_pending_complaints AS
                                            -> SELECT
                                            ->     c.complaint_id,
                                            ->     c.citizen_name,
                                            ->     c.location,
                                            ->     c.description,
                                            ->     c.status,
                                            ->     e.name AS employee_name,
                                            ->     r.route_name
                                            -> FROM complaints c
                                            -> LEFT JOIN employee e ON c.assigned_emp = e.emp_id
                                            -> LEFT JOIN route r ON c.route_id = r.route_id
                                            -> WHERE c.status IN ('Open', 'In Progress');
Query OK, 0 rows affected (0.0590 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL >
 MySQL  localhost:3306 ssl  waste_track  SQL > -- 2. View for vehicle usage (for stats page)
Query OK, 0 rows affected (0.0007 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL > CREATE VIEW v_vehicle_usage AS
                                            -> SELECT
                                            ->     v.vehicle_no,
                                            ->     v.vehicle_type,
                                            ->     v.status,
                                            ->     COUNT(a.assign_id) AS total_assignments
                                            -> FROM vehicle v
                                            -> LEFT JOIN assigned_to a ON v.vehicle_id = a.vehicle_id
                                            -> GROUP BY v.vehicle_id, v.vehicle_no, v.vehicle_type, v.status;
Query OK, 0 rows affected (0.0134 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL >
 MySQL  localhost:3306 ssl  waste_track  SQL > -- 3. View for department summary (for manager & stats)
Query OK, 0 rows affected (0.0007 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL > CREATE VIEW v_department_summary AS
                                            -> SELECT
                                            ->     d.dept_id,
                                            ->     d.name AS department_name,
                                            ->     COUNT(DISTINCT e.emp_id) AS total_employees,
                                            ->     COUNT(DISTINCT v.vehicle_id) AS total_vehicles
                                            -> FROM department d
                                            -> LEFT JOIN employee e ON d.dept_id = e.dept_id
                                            -> LEFT JOIN vehicle v ON d.dept_id = v.dept_id
                                            -> GROUP BY d.dept_id, d.name;
Query OK, 0 rows affected (0.0186 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL >
 MySQL  localhost:3306 ssl  waste_track  SQL > -- 4. View for waste collection stats (for stats page)
Query OK, 0 rows affected (0.0006 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL > CREATE VIEW v_waste_collection_stats AS
                                            -> SELECT
                                            ->     r.route_name,
                                            ->     AVG(w.weight_kg) AS avg_collected_kg,
                                            ->     SUM(w.weight_kg) AS total_collected_kg
                                            -> FROM waste_record w
                                            -> JOIN route r ON w.route_id = r.route_id
                                            -> GROUP BY r.route_name;
Query OK, 0 rows affected (0.0234 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL >
 MySQL  localhost:3306 ssl  waste_track  SQL > -- 5. View for employee performance (for stats page)
Query OK, 0 rows affected (0.0006 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL > CREATE VIEW v_employee_performance AS
                                            -> SELECT
                                            ->     e.name AS employee_name,
                                            ->     e.job_title,
                                            ->     COUNT(c.complaint_id) AS complaints_handled
                                            -> FROM employee e
                                            -> LEFT JOIN complaints c ON e.emp_id = c.assigned_emp
                                            -> WHERE e.role = 'Employee'
                                            -> GROUP BY e.emp_id, e.name, e.job_title;
Query OK, 0 rows affected (0.0091 sec)
 MySQL  localhost:3306 ssl  waste_track  SQL >
```
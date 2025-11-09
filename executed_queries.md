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


-- populating tables:
-- Use the correct database
USE waste_track;

-- -----------------------------------------------------
-- Clear existing data in the correct order (reverse of insertion)
-- -----------------------------------------------------
-- Disabling FK checks allows us to TRUNCATE without order issues
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Complaints;
TRUNCATE TABLE Waste_Record;
TRUNCATE TABLE Assigned_To;
TRUNCATE TABLE Serves;
TRUNCATE TABLE Route;
TRUNCATE TABLE Vehicle;
TRUNCATE TABLE Employee;
TRUNCATE TABLE Department;
SET FOREIGN_KEY_CHECKS = 1;


-- -----------------------------------------------------
-- 1. Populate Departments
-- (Based on BBMP Zones)
-- -----------------------------------------------------
INSERT INTO Department (dept_id, name, location) VALUES
(1, 'South Zone', 'Jayanagar, JP Nagar, BTM Layout'),
(2, 'West Zone', 'Rajajinagar, Yeshwanthpur, Malleswaram'),
(3, 'East Zone', 'Indiranagar, Whitefield, Marathahalli'),
(4, 'North Zone', 'Hebbal, Yelahanka, RT Nagar'),
(5, 'Central Zone', 'MG Road, Shivajinagar, Majestic');

-- -----------------------------------------------------
-- 2. Populate Employees (Managers & Employees)
-- (Password for all is 'pass123')
-- HASH: $2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3
-- -----------------------------------------------------

-- Dept 1: South Zone (1 Manager, 3 Employees)
INSERT INTO Employee (emp_id, name, email, password, role, dept_id, job_title, status) VALUES
(1, 'Priya Sharma', 'manager.south@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 1, 'Zone Manager', 'Active'),
(2, 'Anil Kumar', 'emp.anil@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 1, 'Driver', 'Active'),
(3, 'Sunita Rao', 'emp.sunita@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 1, 'Cleaner', 'Active'),
(4, 'Ravi Verma', 'emp.ravi@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 1, 'Driver', 'Active');

-- Dept 2: West Zone (1 Manager, 3 Employees)
INSERT INTO Employee (emp_id, name, email, password, role, dept_id, job_title, status) VALUES
(5, 'David Wilson', 'manager.west@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 2, 'Zone Manager', 'Active'),
(6, 'Meena Patil', 'emp.meena@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 2, 'Driver', 'Active'),
(7, 'Gopal Singh', 'emp.gopal@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 2, 'Cleaner', 'Active'),
(8, 'Kiran Desai', 'emp.kiran@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 2, 'Driver', 'Active');

-- Dept 3: East Zone (1 Manager, 3 Employees)
INSERT INTO Employee (emp_id, name, email, password, role, dept_id, job_title, status) VALUES
(9, 'Suresh Reddy', 'manager.east@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 3, 'Zone Manager', 'Active'),
(10, 'Aisha Khan', 'emp.aisha@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 3, 'Driver', 'Active'),
(11, 'Manoj Nair', 'emp.manoj@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 3, 'Cleaner', 'Active'),
(12, 'Pooja Gupta', 'emp.pooja@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 3, 'Driver', 'Active');

-- Dept 4: North Zone (1 Manager, 3 Employees)
INSERT INTO Employee (emp_id, name, email, password, role, dept_id, job_title, status) VALUES
(13, 'Rajesh Kumar', 'manager.north@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 4, 'Zone Manager', 'Active'),
(14, 'Imran Baig', 'emp.imran@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 4, 'Driver', 'Active'),
(15, 'Lakshmi Murthy', 'emp.lakshmi@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 4, 'Cleaner', 'Active'),
(16, 'Vijay Raj', 'emp.vijay@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 4, 'Driver', 'Active');

-- Dept 5: Central Zone (1 Manager, 3 Employees)
INSERT INTO Employee (emp_id, name, email, password, role, dept_id, job_title, status) VALUES
(17, 'Fatima Ahmed', 'manager.central@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 5, 'Zone Manager', 'Active'),
(18, 'Arjun Reddy', 'emp.arjun@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 5, 'Driver', 'Active'),
(19, 'Sita Iyer', 'emp.sita@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 5, 'Cleaner', 'Active'),
(20, 'Vikram Singh', 'emp.vikram@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 5, 'Driver', 'Active');

-- -----------------------------------------------------
-- 3. Update Department Manager FKs
-- (Links Departments to their Managers)
-- -----------------------------------------------------
UPDATE Department SET manager_id = 1 WHERE dept_id = 1;
UPDATE Department SET manager_id = 5 WHERE dept_id = 2;
UPDATE Department SET manager_id = 9 WHERE dept_id = 3;
UPDATE Department SET manager_id = 13 WHERE dept_id = 4;
UPDATE Department SET manager_id = 17 WHERE dept_id = 5;

-- -----------------------------------------------------
-- 4. Populate Vehicles
-- (4 vehicles per department)
-- -----------------------------------------------------
INSERT INTO Vehicle (vehicle_id, vehicle_no, dept_id, vehicle_type, status) VALUES
-- Dept 1: South (KA-05)
(1, 'KA-05-MA-1001', 1, 'Tipper Truck', 'Available'),
(2, 'KA-05-MA-1002', 1, 'Tipper Truck', 'In Use'),
(3, 'KA-05-MB-1003', 1, 'Compactor', 'Available'),
(4, 'KA-05-MC-1004', 1, 'Mini Truck', 'In Maintenance'),
-- Dept 2: West (KA-02)
(5, 'KA-02-MA-2001', 2, 'Tipper Truck', 'Available'),
(6, 'KA-02-MB-2002', 2, 'Compactor', 'In Use'),
(7, 'KA-02-MC-2003', 2, 'Mini Truck', 'Available'),
(8, 'KA-02-MD-2004', 2, 'Tipper Truck', 'Available'),
-- Dept 3: East (KA-03)
(9, 'KA-03-MA-3001', 3, 'Compactor', 'Available'),
(10, 'KA-03-MB-3002', 3, 'Compactor', 'Available'),
(11, 'KA-03-MC-3003', 3, 'Tipper Truck', 'In Use'),
(12, 'KA-03-MD-3004', 3, 'Mini Truck', 'Available'),
-- Dept 4: North (KA-04)
(13, 'KA-04-MA-4001', 4, 'Tipper Truck', 'Available'),
(14, 'KA-04-MB-4002', 4, 'Tipper Truck', 'In Use'),
(15, 'KA-04-MC-4003', 4, 'Compactor', 'Available'),
(16, 'KA-04-MD-4004', 4, 'Mini Truck', 'Available'),
-- Dept 5: Central (KA-01)
(17, 'KA-01-MA-5001', 5, 'Mini Truck', 'Available'),
(18, 'KA-01-MB-5002', 5, 'Mini Truck', 'In Use'),
(19, 'KA-01-MC-5003', 5, 'Tipper Truck', 'Available'),
(20, 'KA-01-MD-5004', 5, 'Compactor', 'In Maintenance');

-- -----------------------------------------------------
-- 5. Populate Routes
-- (4 routes per department area)
-- -----------------------------------------------------
INSERT INTO Route (route_id, route_name, location, distance) VALUES
-- Dept 1: South
(1, 'Jayanagar 4th Block', 'Jayanagar', 12.5),
(2, 'JP Nagar 2nd Phase', 'JP Nagar', 15.0),
(3, 'BTM 1st Stage', 'BTM Layout', 10.2),
(4, 'Koramangala 5th Block', 'Koramangala (Near South)', 8.8),
-- Dept 2: West
(5, 'Rajajinagar 1st Block', 'Rajajinagar', 11.0),
(6, 'Malleswaram 8th Cross', 'Malleswaram', 9.5),
(7, 'Yeshwanthpur Market', 'Yeshwanthpur', 14.0),
(8, 'Nagasandra Circle', 'Nagasandra', 16.3),
-- Dept 3: East
(9, 'Indiranagar 100 Ft Rd', 'Indiranagar', 13.0),
(10, 'Whitefield ITPL', 'Whitefield', 22.5),
(11, 'Marathahalli Bridge', 'Marathahalli', 18.0),
(12, 'Bellandur Lake Rd', 'Bellandur', 19.2),
-- Dept 4: North
(13, 'Hebbal Flyover Area', 'Hebbal', 10.0),
(14, 'Yelahanka New Town', 'Yelahanka', 20.5),
(15, 'RT Nagar Main Rd', 'RT Nagar', 8.0),
(16, 'Manyata Tech Park', 'Nagavara', 13.8),
-- Dept 5: Central
(17, 'MG Road & Brigade', 'MG Road', 7.5),
(18, 'Shivajinagar Bus Stand', 'Shivajinagar', 6.0),
(19, 'Commercial Street', 'Tasker Town', 5.5),
(20, 'Majestic Market Area', 'Majestic', 9.0);

-- -----------------------------------------------------
-- 6. Populate Serves (M:N Vehicle <-> Route)
-- (Links vehicles to their standard routes)
-- -----------------------------------------------------
INSERT INTO Serves (vehicle_id, route_id) VALUES
-- South
(1, 1), (1, 2), (2, 3), (2, 4), (3, 1), (3, 4),
-- West
(5, 5), (5, 6), (6, 7), (6, 8), (7, 5), (8, 6),
-- East
(9, 9), (9, 10), (10, 11), (10, 12), (11, 9), (12, 11),
-- North
(13, 13), (13, 16), (14, 14), (15, 15), (16, 13),
-- Central
(17, 17), (17, 19), (18, 18), (18, 20), (19, 17), (20, 20);

-- -----------------------------------------------------
-- 7. Populate Complaints
-- (Simulates citizen submissions)
-- NOTE: We manually set `assigned_emp` here to simulate
-- your backend's auto-assignment logic.
-- -----------------------------------------------------
INSERT INTO Complaints (citizen_name, contact_no, location, description, route_id, dept_id, assigned_emp, status) VALUES
-- South (Dept 1)
('Rohan Gupta', '9880011111', 'Jayanagar 4th Block', 'Garbage not picked up for 3 days.', 1, 1, 2, 'Resolved'),
('Aditi Rao', '9880011112', 'JP Nagar', 'Large pile of construction debris blocking road.', 2, 1, 3, 'In Progress'),
('Vikram Reddy', '9880011113', 'BTM Layout', 'Overflowing bin near BTM Water Tank.', 3, 1, 4, 'In Progress'),
('Nisha Kumar', '9880011114', 'Koramangala 5th Block', 'Street cleaning required, lots of leaf litter.', 4, 1, 2, 'Resolved'),
('Amit Patel', '9880011115', 'Jayanagar 9th Block', 'Dead animal on the road, please remove.', 1, 1, 3, 'In Progress'),

-- West (Dept 2)
('Sandeep Jain', '9880022221', 'Rajajinagar', 'Commercial waste dumped in residential area.', 5, 2, 6, 'Resolved'),
('Divya M', '9880022222', 'Malleswaram 8th Cross', 'Public bin is broken and needs replacement.', 6, 2, 7, 'In Progress'),
('Prakash K', '9880022223', 'Yeshwanthpur', 'Market waste not cleared, strong smell.', 7, 2, 8, 'In Progress'),
('Kavita S', '9880022224', 'Nagasandra', 'Irregular collection frequency this month.', 8, 2, 6, 'Resolved'),
('Harish G', '9880022225', 'Malleswaram', 'Request for bulk waste pickup (old furniture).', 6, 2, 7, 'In Progress'),

-- East (Dept 3)
('Zoya Farooqi', '9880033331', 'Indiranagar 100 Ft Rd', 'Restaurant waste dumped on footpath.', 9, 3, 10, 'Resolved'),
('Arnav Singh', '9880033332', 'Whitefield ITPL', 'Bin near tech park is overflowing.', 10, 3, 11, 'In Progress'),
('Mona Lisa', '9880033333', 'Marathahalli', 'Clogged drain due to garbage dumping.', 11, 3, 12, 'In Progress'),
('Rajeev Menon', '9880033334', 'Bellandur', 'Lake road is filled with plastic waste.', 12, 3, 10, 'Resolved'),
('Chris Dsouza', '9880033335', 'Whitefield', 'Need collection in new apartment complex.', 10, 3, 11, 'In Progress'),

-- North (Dept 4)
('Faisal Ahmed', '9880044441', 'Hebbal', 'Garbage truck is speeding in residential area.', 13, 4, 14, 'Resolved'),
('Gita Shenoy', '9880044442', 'Yelahanka New Town', 'Missed collection on scheduled day.', 14, 4, 15, 'In Progress'),
('Vinod Kumar', '9880044443', 'RT Nagar', 'Request for green waste (garden) pickup.', 15, 4, 16, 'In Progress'),
('Rekha N', '9880044444', 'Manyata Tech Park', 'Food waste bin is damaged.', 16, 4, 14, 'Resolved'),
('Leo Pinto', '9880044445', 'Hebbal', 'Illegal dumping under flyover.', 13, 4, 15, 'In Progress'),

-- Central (Dept 5)
('Sameer Ali', '9880055551', 'MG Road', 'Public bin near metro station is full.', 17, 5, 18, 'Resolved'),
('Tanya Joseph', '9880055552', 'Shivajinagar', 'Waste from bus stand area not cleared.', 18, 5, 19, 'In Progress'),
('Rakesh Shah', '9880055553', 'Commercial Street', 'Shopkeepers dumping waste in alley.', 19, 5, 20, 'In Progress'),
('Priya David', '9880055554', 'Majestic Market', 'Large amount of vegetable waste.', 20, 5, 18, 'Resolved'),
('Anand Murthy', '9880055555', 'Brigade Road', 'Overflowing bin, attracting stray dogs.', 17, 5, 19, 'In Progress');

-- -----------------------------------------------------
-- 8. Populate Waste_Record
-- (Simulates employee entries after collection)
-- -----------------------------------------------------
INSERT INTO Waste_Record (route_id, waste_type, weight_kg, collection_date) VALUES
(1, 'Mixed Waste', 250.5, '2025-10-25'),
(2, 'Construction', 750.0, '2025-10-25'),
(3, 'Mixed Waste', 310.2, '2025-10-25'),
(4, 'Garden Waste', 120.0, '2025-10-24'),
(1, 'Mixed Waste', 230.0, '2025-10-24'),
(5, 'Mixed Waste', 400.7, '2025-10-25'),
(6, 'Recyclable', 150.0, '2025-10-25'),
(7, 'Market Waste', 900.0, '2025-10-25'),
(8, 'Mixed Waste', 210.5, '2025-10-24'),
(6, 'Recyclable', 180.3, '2025-10-24'),
(9, 'Commercial', 620.0, '2025-10-25'),
(10, 'Mixed Waste', 300.0, '2025-10-25'),
(11, 'Mixed Waste', 280.8, '2025-10-24'),
(12, 'Plastic Waste', 450.0, '2025-10-24'),
(10, 'Mixed Waste', 310.0, '2025-10-23'),
(13, 'Mixed Waste', 190.0, '2025-10-25'),
(14, 'Mixed Waste', 220.0, '2025-10-25'),
(15, 'Garden Waste', 130.5, '2025-10-24'),
(17, 'Mixed Waste', 180.0, '2025-10-25'),
(18, 'Market Waste', 700.0, '2025-10-25'),
(19, 'Commercial', 350.0, '2025-10-24'),
(20, 'Market Waste', 850.0, '2025-10-24');

-- -----------------------------------------------------
-- 9. Populate Assigned_To
-- (Simulates manager's specific assignments)
-- -----------------------------------------------------
INSERT INTO Assigned_To (emp_id, vehicle_id, route_id, assign_date) VALUES
(2, 1, 1, '2025-10-25'),
(3, 2, 2, '2025-10-25'),
(4, 3, 3, '2025-10-25'),
(6, 5, 5, '2025-10-25'),
(7, 6, 7, '2025-10-25'),
(8, 7, 6, '2025-10-25'),
(10, 9, 9, '2025-10-25'),
(11, 10, 11, '2025-10-25'),
(12, 11, 10, '2025-10-25'),
(14, 13, 13, '2025-10-25'),
(15, 14, 14, '2025-10-25'),
(16, 15, 15, '2025-10-25'),
(18, 17, 17, '2025-10-25'),
(19, 18, 18, '2025-10-25'),
(20, 19, 19, '2025-10-25');

COMMIT;




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


  MySQL  localhost:3306 ssl  waste_track  SQL > update department set manager_id = 21 where dept_id = 5;
Query OK, 1 row affected (0.0205 sec)

Rows matched: 1  Changed: 1  Warnings: 0
 MySQL  localhost:3306 ssl  waste_track  SQL >  update employee set role = "Manager", dept_id = 5 where emp_id = 21
                                            -> ;
Query OK, 1 row affected (0.0130 sec)

Rows matched: 1  Changed: 1  Warnings: 0
 MySQL  localhost:3306 ssl  waste_track  SQL > ALTER TABLE Complaints
                                            -> MODIFY COLUMN status ENUM('Open', 'In Progress', 'Resolved', 'Closed') DEFAULT 'Open';
Query OK, 0 rows affected (0.1539 sec)

Records: 0  Duplicates: 0  Warnings: 0
 MySQL  localhost:3306 ssl  waste_track  SQL >


```
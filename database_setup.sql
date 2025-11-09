-- -----------------------------------------------------
-- WasteTrack Database Setup Script
-- (Updated for Chart.js and Filter Features)
-- -----------------------------------------------------

-- Drop and Create the database for a fresh start on server launch
DROP DATABASE IF EXISTS waste_track;
CREATE DATABASE IF NOT EXISTS waste_track;
USE waste_track;

-- -----------------------------------------------------
-- Section 1: Create Tables
-- -----------------------------------------------------

-- 1) Department
CREATE TABLE IF NOT EXISTS Department (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_name VARCHAR(100),
    manager_id INT,                -- FK added later
    email VARCHAR(100) UNIQUE,
    location VARCHAR(150)
);

-- 2) Employee (Updated with all new fields and 'Head' role)
CREATE TABLE IF NOT EXISTS Employee (
    emp_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    DOB DATE,
    gender VARCHAR(10),
    salary DECIMAL(10,2),
    job_title VARCHAR(50),
    contact VARCHAR(15),           -- 'phone' from new plan maps to this
    address VARCHAR(255),
    dept_id INT,                   -- FK -> Department
    status VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('Manager', 'Employee', 'Admin', 'Head') DEFAULT 'Employee', -- <-- Added 'Head'
    join_date DATE,                -- <-- NEW
    emp_code VARCHAR(50) UNIQUE,   -- <-- NEW
    CONSTRAINT fk_employee_dept FOREIGN KEY (dept_id)
        REFERENCES Department(dept_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- 3) Vehicle
CREATE TABLE IF NOT EXISTS Vehicle (
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

-- 4) Route (MODIFIED: Added dept_id)
CREATE TABLE IF NOT EXISTS Route (
    route_id INT AUTO_INCREMENT PRIMARY KEY,
    route_name VARCHAR(120),
    from_loc VARCHAR(100),
    to_loc VARCHAR(100),
    location VARCHAR(150),
    distance DECIMAL(6,2),
    estimated_dur TIME,
    fare DECIMAL(8,2),
    dept_id INT,  -- <-- NEWLY ADDED
    CONSTRAINT fk_route_dept FOREIGN KEY (dept_id) 
        REFERENCES department(dept_id) -- <-- NEWLY ADDED
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- 5) Assigned_To
CREATE TABLE IF NOT EXISTS Assigned_To (
    assign_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    route_id INT,
    complaint_id INT, -- <-- Added to link assignment to a specific complaint
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
    -- We will add FK for complaint_id after Complaints table is created
);

-- 6) Serves (Vehicle <-> Route M:N bridge)
CREATE TABLE IF NOT EXISTS Serves (
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

-- 7) Waste_Record
CREATE TABLE IF NOT EXISTS Waste_Record (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT,
    assign_id INT, -- <-- Added to link waste to a specific assignment
    waste_type VARCHAR(50),
    weight_kg DECIMAL(8,2),
    collection_date DATE DEFAULT (CURRENT_DATE),
    processed_status ENUM('Pending','In Transit','Processed') DEFAULT 'Pending',
    CONSTRAINT fk_waste_route FOREIGN KEY (route_id)
        REFERENCES Route(route_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL, -- Changed from CASCADE
    CONSTRAINT fk_waste_assign FOREIGN KEY (assign_id)
        REFERENCES Assigned_To(assign_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- 8) Complaints
CREATE TABLE IF NOT EXISTS Complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_name VARCHAR(100) NOT NULL,
    contact_no VARCHAR(15),
    location VARCHAR(150),
    description TEXT,
    route_id INT,
    assigned_emp INT,
    status ENUM('Open','Pending','In Progress','Resolved', 'Closed') DEFAULT 'Open', -- Updated ENUM
    complaint_date DATETIME DEFAULT (CURRENT_TIMESTAMP), -- Changed to DATETIME
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP), -- Added for filtering
    dept_id INT,
    CONSTRAINT fk_complaint_route FOREIGN KEY (route_id)
        REFERENCES Route(route_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_complaint_emp FOREIGN KEY (assigned_emp)
        REFERENCES Employee(emp_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_complaint_dept FOREIGN KEY (dept_id)
        REFERENCES Department(dept_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Section 2: Add Deferred Foreign Keys
-- -----------------------------------------------------
ALTER TABLE Department
    ADD CONSTRAINT fk_department_manager
    FOREIGN KEY (manager_id) REFERENCES Employee(emp_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
    ADD CONSTRAINT uq_department_manager UNIQUE (manager_id);

ALTER TABLE Assigned_To
    ADD CONSTRAINT fk_assigned_complaint
    FOREIGN KEY (complaint_id) REFERENCES Complaints(complaint_id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

-- -----------------------------------------------------
-- Section 3: Populate Test Data
-- -----------------------------------------------------
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

-- Populate Departments
INSERT INTO Department (dept_id, name, location) VALUES
(1, 'South Zone', 'Jayanagar, JP Nagar, BTM Layout'),
(2, 'West Zone', 'Rajajinagar, Yeshwanthpur, Malleswaram'),
(3, 'East Zone', 'Indiranagar, Whitefield, Marathahalli'),
(4, 'North Zone', 'Hebbal, Yelahanka, RT Nagar'),
(5, 'Central Zone', 'MG Road, Shivajinagar, Majestic');

-- Populate Employees (Password for all is 'pass123', HASH: $2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3)
INSERT INTO Employee (emp_id, name, email, password, role, dept_id, job_title, status) VALUES
(1, 'Priya Sharma', 'manager.south@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 1, 'Zone Manager', 'Active'),
(2, 'Anil Kumar', 'emp.anil@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 1, 'Driver', 'Active'),
(3, 'Sunita Rao', 'emp.sunita@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 1, 'Cleaner', 'Active'),
(4, 'Ravi Verma', 'emp.ravi@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 1, 'Driver', 'Active'),
(5, 'David Wilson', 'manager.west@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 2, 'Zone Manager', 'Active'),
(6, 'Meena Patil', 'emp.meena@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 2, 'Driver', 'Active'),
(7, 'Gopal Singh', 'emp.gopal@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 2, 'Cleaner', 'Active'),
(8, 'Kiran Desai', 'emp.kiran@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 2, 'Driver', 'Active'),
(9, 'Suresh Reddy', 'manager.east@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 3, 'Zone Manager', 'Active'),
(10, 'Aisha Khan', 'emp.aisha@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 3, 'Driver', 'Active'),
(11, 'Manoj Nair', 'emp.manoj@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 3, 'Cleaner', 'Active'),
(12, 'Pooja Gupta', 'emp.pooja@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 3, 'Driver', 'Active'),
(13, 'Rajesh Kumar', 'manager.north@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 4, 'Zone Manager', 'Active'),
(14, 'Imran Baig', 'emp.imran@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 4, 'Driver', 'Active'),
(15, 'Lakshmi Murthy', 'emp.lakshmi@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 4, 'Cleaner', 'Active'),
(16, 'Vijay Raj', 'emp.vijay@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 4, 'Driver', 'Active'),
(17, 'Fatima Ahmed', 'manager.central@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Manager', 5, 'Zone Manager', 'Active'),
(18, 'Arjun Reddy', 'emp.arjun@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 5, 'Driver', 'Active'),
(19, 'Sita Iyer', 'emp.sita@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 5, 'Cleaner', 'Active'),
(20, 'Vikram Singh', 'emp.vikram@wastetrack.com', '$2a$10$N9Z.q.a/1N.5dE.l5.a.9uLd8.g.s.X/eY.f.h.s.V.3.i.u.3', 'Employee', 5, 'Driver', 'Active');

-- Update Department Manager FKs
UPDATE Department SET manager_id = 1 WHERE dept_id = 1;
UPDATE Department SET manager_id = 5 WHERE dept_id = 2;
UPDATE Department SET manager_id = 9 WHERE dept_id = 3;
UPDATE Department SET manager_id = 13 WHERE dept_id = 4;
UPDATE Department SET manager_id = 17 WHERE dept_id = 5;

-- Populate Vehicles
INSERT INTO Vehicle (vehicle_id, vehicle_no, dept_id, vehicle_type, status) VALUES
(1, 'KA-05-MA-1001', 1, 'Tipper Truck', 'Available'),(2, 'KA-05-MA-1002', 1, 'Tipper Truck', 'In Use'), (3, 'KA-05-MB-1003', 1, 'Compactor', 'Available'),(4, 'KA-05-MC-1004', 1, 'Mini Truck', 'In Maintenance'),
(5, 'KA-02-MA-2001', 2, 'Tipper Truck', 'Available'),(6, 'KA-02-MB-2002', 2, 'Compactor', 'In Use'),(7, 'KA-02-MC-2003', 2, 'Mini Truck', 'Available'),(8, 'KA-02-MD-2004', 2, 'Tipper Truck', 'Available'),
(9, 'KA-03-MA-3001', 3, 'Compactor', 'Available'),(10, 'KA-03-MB-3002', 3, 'Compactor', 'Available'),(11, 'KA-03-MC-3003', 3, 'Tipper Truck', 'In Use'),(12, 'KA-03-MD-3004', 3, 'Mini Truck', 'Available'),
(13, 'KA-04-MA-4001', 4, 'Tipper Truck', 'Available'),(14, 'KA-04-MB-4002', 4, 'Tipper Truck', 'In Use'),(15, 'KA-04-MC-4003', 4, 'Compactor', 'Available'),(16, 'KA-04-MD-4004', 4, 'Mini Truck', 'Available'),
(17, 'KA-01-MA-5001', 5, 'Mini Truck', 'Available'),(18, 'KA-01-MB-5002', 5, 'Mini Truck', 'In Use'),(19, 'KA-01-MC-5003', 5, 'Tipper Truck', 'Available'),(20, 'KA-01-MD-5004', 5, 'Compactor', 'In Maintenance');

-- Populate Routes (MODIFIED: Added dept_id)
INSERT INTO Route (route_id, route_name, location, distance, dept_id) VALUES
(1, 'Jayanagar 4th Block', 'Jayanagar', 12.5, 1),(2, 'JP Nagar 2nd Phase', 'JP Nagar', 15.0, 1),(3, 'BTM 1st Stage', 'BTM Layout', 10.2, 1),(4, 'Koramangala 5th Block', 'Koramangala (Near South)', 8.8, 1),
(5, 'Rajajinagar 1st Block', 'Rajajinagar', 11.0, 2),(6, 'Malleswaram 8th Cross', 'Malleswaram', 9.5, 2),(7, 'Yeshwanthpur Market', 'Yeshwanthpur', 14.0, 2),(8, 'Nagasandra Circle', 'Nagasandra', 16.3, 2),
(9, 'Indiranagar 100 Ft Rd', 'Indiranagar', 13.0, 3),(10, 'Whitefield ITPL', 'Whitefield', 22.5, 3),(11, 'Marathahalli Bridge', 'Marathahalli', 18.0, 3),(12, 'Bellandur Lake Rd', 'Bellandur', 19.2, 3),
(13, 'Hebbal Flyover Area', 'Hebbal', 10.0, 4),(14, 'Yelahanka New Town', 'Yelahanka', 20.5, 4),(15, 'RT Nagar Main Rd', 'RT Nagar', 8.0, 4),(16, 'Manyata Tech Park', 'Nagavara', 13.8, 4),
(17, 'MG Road & Brigade', 'MG Road', 7.5, 5),(18, 'Shivajinagar Bus Stand', 'Shivajinagar', 6.0, 5),(19, 'Commercial Street', 'Tasker Town', 5.5, 5),(20, 'Majestic Market Area', 'Majestic', 9.0, 5);

-- Populate Serves (Vehicle <-> Route)
INSERT INTO Serves (vehicle_id, route_id) VALUES
(1, 1), (1, 2), (2, 3), (2, 4), (3, 1), (3, 4), (5, 5), (5, 6), (6, 7), (6, 8), (7, 5), (8, 6),
(9, 9), (9, 10), (10, 11), (10, 12), (11, 9), (12, 11), (13, 13), (13, 16), (14, 14), (15, 15), (16, 13),
(17, 17), (17, 19), (18, 18), (18, 20), (19, 17), (20, 20);

-- Populate Complaints
INSERT INTO Complaints (complaint_id, citizen_name, contact_no, location, description, route_id, dept_id, assigned_emp, status, complaint_date) VALUES
(1, 'Rohan Gupta', '9880011111', 'Jayanagar 4th Block', 'Garbage not picked up for 3 days.', 1, 1, 2, 'Resolved', '2025-10-20 10:00:00'),
(2, 'Aditi Rao', '9880011112', 'JP Nagar', 'Large pile of construction debris blocking road.', 2, 1, 3, 'In Progress', '2025-10-21 11:00:00'),
(3, 'Vikram Reddy', '9880011113', 'BTM Layout', 'Overflowing bin near BTM Water Tank.', 3, 1, 4, 'In Progress', '2025-10-22 12:00:00'),
(4, 'Nisha Kumar', '9880011114', 'Koramangala 5th Block', 'Street cleaning required, lots of leaf litter.', 4, 1, 2, 'Resolved', '2025-10-23 13:00:00'),
(5, 'Amit Patel', '9880011115', 'Jayanagar 9th Block', 'Dead animal on the road, please remove.', 1, 1, 3, 'In Progress', '2025-10-24 14:00:00'),
(6, 'Sandeep Jain', '9880022221', 'Rajajinagar', 'Commercial waste dumped in residential area.', 5, 2, 6, 'Resolved', '2025-10-20 10:00:00'),
(7, 'Divya M', '9880022222', 'Malleswaram 8th Cross', 'Public bin is broken and needs replacement.', 6, 2, 7, 'In Progress', '2025-10-21 11:00:00'),
(8, 'Prakash K', '9880022223', 'Yeshwanthpur', 'Market waste not cleared, strong smell.', 7, 2, 8, 'In Progress', '2025-10-22 12:00:00'),
(9, 'Kavita S', '9880022224', 'Nagasandra', 'Irregular collection frequency this month.', 8, 2, 6, 'Resolved', '2025-10-23 13:00:00'),
(10, 'Harish G', '9880022225', 'Malleswaram', 'Request for bulk waste pickup (old furniture).', 6, 2, 7, 'In Progress', '2025-10-24 14:00:00'),
(11, 'Zoya Farooqi', '9880033331', 'Indiranagar 100 Ft Rd', 'Restaurant waste dumped on footpath.', 9, 3, 10, 'Resolved', '2025-10-20 10:00:00'),
(12, 'Arnav Singh', '9880033332', 'Whitefield ITPL', 'Bin near tech park is overflowing.', 10, 3, 11, 'In Progress', '2025-10-21 11:00:00'),
(13, 'Mona Lisa', '9880033333', 'Marathahalli', 'Clogged drain due to garbage dumping.', 11, 3, 12, 'In Progress', '2025-10-22 12:00:00'),
(14, 'Rajeev Menon', '9880033334', 'Bellandur', 'Lake road is filled with plastic waste.', 12, 3, 10, 'Resolved', '2025-10-23 13:00:00'),
(15, 'Chris Dsouza', '9880033335', 'Whitefield', 'Need collection in new apartment complex.', 10, 3, 11, 'In Progress', '2025-10-24 14:00:00'),
(16, 'Faisal Ahmed', '9880044441', 'Hebbal', 'Garbage truck is speeding in residential area.', 13, 4, 14, 'Resolved', '2025-10-20 10:00:00'),
(17, 'Gita Shenoy', '9880044442', 'Yelahanka New Town', 'Missed collection on scheduled day.', 14, 4, 15, 'In Progress', '2025-10-21 11:00:00'),
(18, 'Vinod Kumar', '9880044443', 'RT Nagar', 'Request for green waste (garden) pickup.', 15, 4, 16, 'In Progress', '2025-10-22 12:00:00'),
(19, 'Rekha N', '9880044444', 'Manyata Tech Park', 'Food waste bin is damaged.', 16, 4, 14, 'Resolved', '2025-10-23 13:00:00'),
(20, 'Leo Pinto', '9880044445', 'Hebbal', 'Illegal dumping under flyover.', 13, 4, 15, 'In Progress', '2025-10-24 14:00:00'),
(21, 'Sameer Ali', '9880055551', 'MG Road', 'Public bin near metro station is full.', 17, 5, 18, 'Resolved', '2025-10-20 10:00:00'),
(22, 'Tanya Joseph', '9880055552', 'Shivajinagar', 'Waste from bus stand area not cleared.', 18, 5, 19, 'In Progress', '2025-10-21 11:00:00'),
(23, 'Rakesh Shah', '9880055553', 'Commercial Street', 'Shopkeepers dumping waste in alley.', 19, 5, 20, 'In Progress', '2025-10-22 12:00:00'),
(24, 'Priya David', '9880055554', 'Majestic Market', 'Large amount of vegetable waste.', 20, 5, 18, 'Resolved', '2025-10-23 13:00:00'),
(25, 'Anand Murthy', '9880055555', 'Brigade Road', 'Overflowing bin, attracting stray dogs.', 17, 5, 19, 'In Progress', '2025-10-24 14:00:00');

-- Populate Waste_Record
INSERT INTO Waste_Record (record_id, route_id, waste_type, weight_kg, collection_date) VALUES
(1, 1, 'Mixed Waste', 250.5, '2025-10-25'), (2, 2, 'Construction', 750.0, '2025-10-25'),(3, 3, 'Mixed Waste', 310.2, '2025-10-25'),(4, 4, 'Garden Waste', 120.0, '2025-10-24'),(5, 1, 'Mixed Waste', 230.0, '2025-10-24'),
(6, 5, 'Mixed Waste', 400.7, '2025-10-25'),(7, 6, 'Recyclable', 150.0, '2025-10-25'),(8, 7, 'Market Waste', 900.0, '2025-10-25'),(9, 8, 'Mixed Waste', 210.5, '2025-10-24'),(10, 6, 'Recyclable', 180.3, '2025-10-24'),
(11, 9, 'Commercial', 620.0, '2025-10-25'),(12, 10, 'Mixed Waste', 300.0, '2025-10-25'),(13, 11, 'Mixed Waste', 280.8, '2025-10-24'),(14, 12, 'Plastic Waste', 450.0, '2025-10-24'),(15, 10, 'Mixed Waste', 310.0, '2025-10-23'),
(16, 13, 'Mixed Waste', 190.0, '2025-10-25'),(17, 14, 'Mixed Waste', 220.0, '2025-10-25'),(18, 15, 'Garden Waste', 130.5, '2025-10-24'),(19, 17, 'Mixed Waste', 180.0, '2025-10-25'),(20, 18, 'Market Waste', 700.0, '2025-10-25'),
(21, 19, 'Commercial', 350.0, '2025-10-24'),(22, 20, 'Market Waste', 850.0, '2025-10-24');

-- Populate Assigned_To
INSERT INTO Assigned_To (assign_id, emp_id, vehicle_id, route_id, complaint_id, assign_date) VALUES
(1, 2, 1, 1, 1, '2025-10-25'), (2, 3, 2, 2, 2, '2025-10-25'),(3, 4, 3, 3, 3, '2025-10-25'),
(4, 6, 5, 5, 6, '2025-10-25'), (5, 7, 6, 7, 7, '2025-10-25'),(6, 8, 7, 6, 8, '2025-10-25'),
(7, 10, 9, 9, 11, '2025-10-25'),(8, 11, 10, 11, 12, '2025-10-25'),(9, 12, 11, 10, 13, '2025-10-25'),
(10, 14, 13, 13, 16, '2025-10-25'),(11, 15, 14, 14, 17, '2025-10-25'),(12, 16, 15, 15, 18, '2025-10-25'),
(13, 18, 17, 17, 21, '2025-10-25'),(14, 19, 18, 18, 22, '2025-10-25'),(15, 20, 19, 19, 23, '2025-10-25');

-- -----------------------------------------------------
-- Section 4: Create Views (UPDATED)
-- -----------------------------------------------------

-- View 1: Pending Complaints
CREATE OR REPLACE VIEW v_pending_complaints AS
SELECT c.complaint_id, c.citizen_name, c.contact_no, c.location, c.description, c.status,
       d.dept_id, d.name AS department_name,
       e.emp_id, e.name AS employee_name, r.route_id, r.route_name
FROM complaints c
LEFT JOIN department d ON c.dept_id = d.dept_id
LEFT JOIN employee e ON c.assigned_emp = e.emp_id
LEFT JOIN route r ON c.route_id = r.route_id
WHERE c.status IN ('Open','Pending', 'In Progress');

-- View 2: Vehicle Usage
CREATE OR REPLACE VIEW v_vehicle_usage AS
SELECT v.vehicle_id, v.vehicle_no, v.vehicle_type AS vehicle_type, v.status AS vehicle_status,
       COUNT(a.assign_id) AS total_assignments
FROM vehicle v
LEFT JOIN assigned_to a ON v.vehicle_id = a.vehicle_id
GROUP BY v.vehicle_id, v.vehicle_no, v.vehicle_type, v.status;

-- View 3: Department Summary
CREATE OR REPLACE VIEW v_department_summary AS
SELECT d.dept_id, d.name AS department_name,
       COUNT(DISTINCT e.emp_id) AS total_employees,
       COUNT(DISTINCT v.vehicle_id) AS total_vehicles
FROM department d
LEFT JOIN employee e ON d.dept_id = e.dept_id
LEFT JOIN vehicle v ON d.dept_id = v.dept_id
GROUP BY d.dept_id, d.name;

-- View 4: Waste Collection Stats
CREATE OR REPLACE VIEW v_waste_collection_stats AS
SELECT r.route_id, r.route_name, COUNT(w.record_id) AS records, SUM(w.weight_kg) AS total_collected_kg,
       AVG(w.weight_kg) AS avg_collected_kg
FROM waste_record w
JOIN route r ON w.route_id = r.route_id
GROUP BY r.route_id, r.route_name;

-- View 5: Employee Performance
CREATE OR REPLACE VIEW v_employee_performance AS
SELECT e.emp_id, e.name AS employee_name, e.dept_id, d.name AS department_name,
       COUNT(c.complaint_id) AS complaints_handled
FROM employee e
LEFT JOIN complaints c ON e.emp_id = c.assigned_emp AND c.status IN ('Resolved','Closed')
LEFT JOIN department d ON e.dept_id = d.dept_id
WHERE e.role = 'Employee'
GROUP BY e.emp_id, e.name, e.dept_id, d.name;

-- View 6: Employee Tasks (NEW)
CREATE OR REPLACE VIEW v_employee_tasks AS
SELECT a.assign_id, a.emp_id, e.name AS employee_name, a.vehicle_id, v.vehicle_no,
       a.route_id, r.route_name, c.complaint_id, c.description, c.status,
       w.record_id, w.weight_kg, w.collection_date AS waste_recorded_at, d.name AS department_name
FROM assigned_to a
LEFT JOIN employee e ON a.emp_id = e.emp_id
LEFT JOIN vehicle v ON a.vehicle_id = v.vehicle_id
LEFT JOIN route r ON a.route_id = r.route_id
LEFT JOIN complaints c ON a.complaint_id = c.complaint_id
LEFT JOIN waste_record w ON w.route_id = a.route_id AND w.collection_date = a.assign_date
LEFT JOIN department d ON e.dept_id = d.dept_id;

-- -----------------------------------------------------
-- Section 5: Final Confirmation
-- -----------------------------------------------------
COMMIT;
SELECT 'Database setup complete.' AS Status;
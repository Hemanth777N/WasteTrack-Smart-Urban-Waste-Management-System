```sql

-- 1. Employee Table
CREATE TABLE Employee (
    emp_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    DOB DATE,
    gender VARCHAR(10),
    salary DECIMAL(10,2),
    job_title VARCHAR(50),
    contact VARCHAR(15),
    address VARCHAR(255),
    dept_id INT,    -- Employee belongs to a department
    status VARCHAR(20),
);

-- 2. Department Table
CREATE TABLE Department (
    dept_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    manager_name VARCHAR(100),
    manage_id INT UNIQUE,   -- One manager per department (1:1 mapping)
    email VARCHAR(100) UNIQUE,
    FOREIGN KEY (manage_id) REFERENCES Employee(emp_id)
);

-- altering employee table to add foreign key

ALTER TABLE Employee
ADD CONSTRAINT fk_employee_department
FOREIGN KEY (dept_id) REFERENCES Department(dept_id);



-- 3. Vehicle Table
CREATE TABLE Vehicle (
    vehicle_id INT PRIMARY KEY,
    dept_id INT,   -- Vehicle belongs to a department
    capacity INT,
    serving_from DATE,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
);

-- 4. Route Table
CREATE TABLE Route (
    route_id INT PRIMARY KEY,
    from_loc VARCHAR(100),
    to_loc VARCHAR(100),
    distance DECIMAL(6,2),
    estimated_dur TIME,
    fare DECIMAL(8,2)
);

-- 5. Assigned_to Relationship Table (Employee <-> Vehicle)
CREATE TABLE Assigned_to (
    assign_id INT PRIMARY KEY, -- Unique identifier for assignment
    emp_id INT,
    vehicle_id INT,
    departure_from VARCHAR(100),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id)
);

-- 6. Serves Relationship Table (Vehicle <-> Route)
CREATE TABLE Serves (
    vehicle_id INT,
    route_id INT,
    PRIMARY KEY (vehicle_id, route_id),
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id),
    FOREIGN KEY (route_id) REFERENCES Route(route_id)
);

-- Department has manage_id → FK referencing Employee(emp_id).
-- Employee has dept_id → FK referencing Department(dept_id).
-- Insert Employees without dept_id
INSERT INTO Employee (emp_id, name, DOB, gender, salary, job_title, contact, address, dept_id, status) VALUES
(101, 'Ravi Kumar', '1980-03-15', 'Male', 65000, 'Manager', '9876543210', 'BTM Layout, Bangalore', NULL, 'Active'),
(102, 'Priya Sharma', '1985-07-22', 'Female', 70000, 'Manager', '9812345678', 'Indiranagar, Bangalore', NULL, 'Active'),
(103, 'Sandeep Reddy', '1979-11-10', 'Male', 68000, 'Manager', '9123456789', 'Jayanagar, Bangalore', NULL, 'Active'),
(104, 'Anita Rao', '1988-05-18', 'Female', 64000, 'Manager', '9001234567', 'Whitefield, Bangalore', NULL, 'Active'),
(105, 'Manoj Singh', '1983-01-30', 'Male', 72000, 'Manager', '9098765432', 'Koramangala, Bangalore', NULL, 'Active');

-- Insert Departments (linking managers)
INSERT INTO Department (dept_id, name, manager_name, manage_id, email) VALUES
(1, 'Waste Collection', 'Ravi Kumar', 101, 'ravi.k@wastetrack.com'),
(2, 'Recycling Unit', 'Priya Sharma', 102, 'priya.s@wastetrack.com'),
(3, 'Logistics', 'Sandeep Reddy', 103, 'sandeep.r@wastetrack.com'),
(4, 'Maintenance', 'Anita Rao', 104, 'anita.r@wastetrack.com'),
(5, 'Operations', 'Manoj Singh', 105, 'manoj.s@wastetrack.com');


-- Update Employees with dept_id
UPDATE Employee SET dept_id = 1 WHERE emp_id = 101;
UPDATE Employee SET dept_id = 2 WHERE emp_id = 102;
UPDATE Employee SET dept_id = 3 WHERE emp_id = 103;
UPDATE Employee SET dept_id = 4 WHERE emp_id = 104;
UPDATE Employee SET dept_id = 5 WHERE emp_id = 105;

-- Insert other Employees (non-managers)
INSERT INTO Employee (emp_id, name, DOB, gender, salary, job_title, contact, address, dept_id, status) VALUES
(201, 'Kiran Kumar', '1992-02-20', 'Male', 35000, 'Driver', '9911223344', 'HSR Layout, Bangalore', 1, 'Active'),
(202, 'Divya Shetty', '1995-09-12', 'Female', 30000, 'Cleaner', '9988776655', 'Marathahalli, Bangalore', 1, 'Active'),
(203, 'Arjun Gowda', '1990-12-05', 'Male', 36000, 'Driver', '8877665544', 'Hebbal, Bangalore', 3, 'Active'),
(204, 'Meena R', '1996-04-25', 'Female', 28000, 'Technician', '7766554433', 'Malleswaram, Bangalore', 4, 'Active'),
(205, 'Rahul Verma', '1991-06-14', 'Male', 32000, 'Supervisor', '6655443322', 'Rajajinagar, Bangalore', 5, 'Active');

-- vehicle
INSERT INTO Vehicle (vehicle_id, dept_id, capacity, serving_from) VALUES
(301, 1, 2000, '2020-01-10'),
(302, 1, 1500, '2021-03-15'),
(303, 3, 2500, '2019-08-20'),
(304, 4, 1000, '2022-02-12'),
(305, 5, 1800, '2021-06-05');


-- route
INSERT INTO Route (route_id, from_loc, to_loc, distance, estimated_dur, fare) VALUES
(401, 'Majestic', 'Indiranagar', 12.5, '00:30:00', 50),
(402, 'Koramangala', 'Whitefield', 18.0, '00:45:00', 70),
(403, 'Jayanagar', 'Electronic City', 22.3, '01:00:00', 90),
(404, 'Hebbal', 'MG Road', 10.2, '00:25:00', 40),
(405, 'Malleswaram', 'Yeshwanthpur', 8.5, '00:20:00', 30);


-- assigned_to
INSERT INTO Assigned_to (assign_id, emp_id, vehicle_id, departure_from) VALUES
(501, 201, 301, 'Majestic'),
(502, 202, 302, 'BTM Layout'),
(503, 203, 303, 'Jayanagar'),
(504, 204, 304, 'Whitefield'),
(505, 205, 305, 'Rajajinagar');


-- serves
INSERT INTO Serves (vehicle_id, route_id) VALUES
(301, 401),
(302, 402),
(303, 403),
(304, 404),
(305, 405);



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


```
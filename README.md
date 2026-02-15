# WasteTrack: Smart-Urban-Waste-Management-System

## Project Overview

WasteTrack is a web-based application designed to streamline municipal solid waste collection and complaint handling through a centralized database system. The application replaces manual processes with a digital, role-based platform to improve efficiency and accountability.

## Core Features

* **Administrator Dashboard**: Manage users, assign vehicles to specific areas, monitor collection progress, and resolve complaints.
* **Citizen Portal**: File complaints, track status, and view collection details.
* **Vehicle Operator Interface**: Receive area assignments and update collection statuses.
* **Relational Database**: Normalized tables ensure data integrity across employees, departments, vehicles, and routes.

## Tech Stack

* **Frontend**: HTML, CSS, JavaScript
* **Backend**: Node.js
* **Database**: MySQL

## Database Schema

The system utilizes a relational model consisting of the following primary entities:

* **Employee**: Stores personal details, job titles, and department affiliations.
* **Department**: Manages organizational units and their assigned managers.
* **Vehicle**: Tracks waste collection units and their capacities.
* **Route**: Defines collection paths, distances, and estimated durations.
* **Assigned_to**: Maps employees to specific vehicles for duty.
* **Serves**: Maps vehicles to specific routes.

## Installation and Setup

1. Clone the repository to your local machine.
2. Ensure Node.js and MySQL are installed.
3. Import the database schema using the provided SQL scripts.
4. **Database Initialization**: Open your MySQL terminal and run:
```sql
SOURCE path/to/database_setup.sql;
```
5. Run `npm install` to install dependencies.
6. Start the server using `node server.js` or `npm start`.
7. **Start the Application**:
```bash
node server.js
```

## Authors

* Hemanth777N

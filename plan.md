🌍 **WasteTrack – Complete User Story**

### 🎯 **Goal**

To digitize the waste collection and vehicle management process for a city by creating a **centralized web platform** that connects **citizens, employees, and administrators**, improving operational efficiency and transparency.

---

### 🧑‍💻 **Actors in the System**

1. **Citizen/User**

   * Reports waste-related issues (e.g., uncollected garbage, overflowing bins).
   * Provides complaint details such as name, location, type of issue, and description.
   * Can track the complaint’s status (e.g., *Pending*, *In Progress*, *Resolved*).

2. **Administrator**

   * Manages employee and department details.
   * Reviews new complaints.
   * Assigns the complaint to a department (e.g., *Waste Collection Department*).
   * Allocates a vehicle and employee (driver or cleaner) for that route.
   * Monitors the progress of complaints and updates their resolution status.

3. **Employee (Driver / Cleaner / Technician)**

   * Logs in to view assigned routes or complaints.
   * Updates the status (e.g., *Reached site*, *Collection done*, *Resolved*).
   * Records departure and completion details.

4. **System (WasteTrack Database)**

   * Stores all user, employee, vehicle, department, route, and complaint data.
   * Maintains relationships between employees, vehicles, and routes.
   * Ensures accountability via timestamps and foreign key relations.

---

### ⚙️ **Flow of Operations (Step-by-Step)**

#### 🏙️ 1. **Citizen Submits Complaint**

* User fills a complaint form on the website (`complaint.html`).
* Inputs: name, contact, location (area), type of issue, description, date.
* Complaint is stored in the `Complaint` table with a default status = “Pending”.

#### 🧾 2. **Admin Reviews the Complaint**

* Admin dashboard lists all complaints.
* Admin assigns the complaint to a **Department** (like *Waste Collection* or *Recycling Unit*).

#### 🚛 3. **Department Takes Charge**

* The assigned department checks which vehicle and employees are available.
* Through the **Assigned_to** table, the admin links an *Employee* and *Vehicle*.
* A route (in the **Route** table) corresponding to the complaint’s location is chosen.
* The vehicle is linked to that route via **Serves** table.

#### 🧍‍♂️ 4. **Employee Executes the Task**

* Assigned employee logs in, sees the task (with location, vehicle ID, route).
* Employee departs (`departure_from` logged in **Assigned_to**).
* Once task is completed, status is updated to “Resolved”.

#### 📊 5. **Citizen Can Track Progress**

* The citizen can revisit the site and enter the complaint ID to track the current status.
* They may also view resolved history.

#### 🏁 6. **Admin Verifies & Closes**

* Admin verifies the completion via proof (photo or report).
* The complaint is marked as “Closed” and archived.

---

### 📈 **Result**

* Efficient tracking of waste collection.
* Reduced manual coordination.
* Real-time accountability (who, when, where).
* Transparent complaint resolution for citizens.

---

## 🧱 Updated Database Plan (Next Step)

Since you correctly noted that **routes** should represent **locations**, we’ll:

* Replace `from_loc` and `to_loc` in `Route` with just `location`.
* Add **AUTO_INCREMENT** where appropriate (`emp_id`, `dept_id`, `vehicle_id`, `route_id`, etc.).
* Prepare the schema for integration with your **Node.js backend**.

---
Perfect 👍 — you’ve done a **solid foundation** already:
✅ Database (8 linked tables)
✅ Working backend connection (`server.js`)
✅ Working frontend (complaint form + live table view)
✅ Proper directory structure

Now your final week’s task wants a *complete, impressive full-stack system* where:

1. All tables are **connected** (not just one).
2. You show **views + joins + aggregate queries**.
3. There’s a **clean frontend** (citizen/admin dashboard feel).

Let’s make a **step-by-step plan** so you can finish this properly and on time.

---

## 🧩 1️⃣ Phase 1 — Project Planning (Today)

### 🎯 Objective

Create a **clear connection map** between frontend <-> backend <-> MySQL.

### ✅ Tasks

* Keep your current `/api/complaints` working as your **base template**.
* Identify which tables you’ll actually show:

  * `Complaints` → Citizen page
  * `Employee`, `Vehicle`, `Route` → Admin page
  * `Department`, `Assigned_to`, `Waste_Record` → Analytics or Management section
* Decide what your **views** will show (example below 👇)

### 🧠 Suggestion for 5 SQL Views

| View Name                  | Description                                       | SQL Example                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v_pending_complaints`     | Show all pending complaints with route & employee | `SELECT c.*, e.name AS employee_name, r.route_name FROM complaints c LEFT JOIN employee e ON c.assigned_emp=e.emp_id LEFT JOIN route r ON c.route_id=r.route_id WHERE c.status='Open';`                                                   |
| `v_vehicle_usage`          | Vehicle assignment count & current status         | `SELECT v.vehicle_no, COUNT(a.assign_id) AS total_assignments, v.status FROM vehicle v LEFT JOIN assigned_to a ON v.vehicle_id=a.vehicle_id GROUP BY v.vehicle_no;`                                                                       |
| `v_department_summary`     | Total employees, total vehicles per department    | `SELECT d.name, COUNT(DISTINCT e.emp_id) AS total_employees, COUNT(DISTINCT v.vehicle_id) AS total_vehicles FROM department d LEFT JOIN employee e ON d.dept_id=e.dept_id LEFT JOIN vehicle v ON d.dept_id=v.dept_id GROUP BY d.dept_id;` |
| `v_waste_collection_stats` | Avg. waste collected per route                    | `SELECT r.route_name, AVG(w.weight_kg) AS avg_collected FROM waste_record w JOIN route r ON w.route_id=r.route_id GROUP BY r.route_name;`                                                                                                 |
| `v_employee_performance`   | No. of complaints handled by employee             | `SELECT e.name, COUNT(c.complaint_id) AS complaints_handled FROM employee e LEFT JOIN complaints c ON e.emp_id=c.assigned_emp GROUP BY e.name;`                                                                                           |

Each of these views can be connected to a simple table in your frontend via `/api/views/...` endpoints.

---

## ⚙️ 2️⃣ Phase 2 — Backend Expansion (Next 1–2 Days)

You’ll extend `server.js` as follows:

### 📂 Backend Directory Plan

```
source/
  backend/
    server.js
    db.js                ← (central MySQL pool)
    routes/
       complaints.js     ← existing
       employees.js
       vehicles.js
       views.js          ← to return view data
```

### 🛠 Steps

* Create `/api/employees`, `/api/vehicles`, `/api/routes` — all with `GET` + `POST`.
* Add `/api/views/<viewname>` to fetch data from created SQL views.
* Optional: `/api/stats` for aggregate data (like total complaints, resolved, pending).

Each route file can use this shared import:

```js
// db.js
const mysql = require("mysql2/promise");
module.exports = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "yourpassword",
  database: "waste_track"
});
```

---

## 🎨 3️⃣ Phase 3 — Frontend UI (2–3 Days)

### 📁 Frontend Directory Plan

```
source/
  complaint.html        ← citizen view (done)
  admin.html            ← admin dashboard (manage all)
  stats.html            ← analytics of views
  style.css
```

### 💡 Suggestions

* Use simple **cards and tables** for UI using plain CSS or Tailwind (CDN link).
* **Admin Page Sections:**

  * Add New Employee / Vehicle (Forms)
  * View All Departments
  * View Complaints + Assign employee/vehicle dropdowns
* **Stats Page:**

  * Fetch `/api/views/...` data → Display in tables or charts (e.g., Chart.js).

---

## 📊 4️⃣ Phase 4 — Views + Analytics (1–2 Days)

After creating the 5 SQL views:

```sql
CREATE VIEW v_pending_complaints AS ...
CREATE VIEW v_vehicle_usage AS ...
...
```

Then in backend:

```js
app.get("/api/views/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const [rows] = await pool.query(`SELECT * FROM ${name}`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "View fetch error" });
  }
});
```

Then in `stats.html`:

```js
async function loadView(name, tableId) {
  const res = await fetch(`/api/views/${name}`);
  const data = await res.json();
  const tbody = document.querySelector(`#${tableId} tbody`);
  tbody.innerHTML = data.map(row =>
    `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`
  ).join('');
}
loadView('v_vehicle_usage', 'vehicleUsageTable');
```

---

## 💻 5️⃣ Phase 5 — UI Polish & Demo Setup (Final 1–2 Days)

* Add logo/banner → “🌱 WasteTrack City Portal”
* Add buttons between pages (`complaint.html`, `admin.html`, `stats.html`)
* Add basic popup alerts (like “Inserted successfully!”)
* Test both **insert + reflection** (frontend and DB sync both ways)
* Prepare demo flow:

  1. Citizen adds complaint.
  2. Admin dashboard shows it.
  3. Status updated to “Resolved”.
  4. Stats page shows live update.

---

## 🔥 My Opinion

This structure will **impress your evaluators** because:

* It connects all tables logically.
* You’ll have **real working CRUD + analytics**.
* The views and UI give it a *professional admin dashboard* vibe.
* You’ll easily explain how the frontend reflects the DB and vice versa.

---

Would you like me to give you the **next actionable step** (i.e., code for Phase 2 backend expansion with multiple tables and view endpoints)?






following are the workflow and changes had to be done in the plan(give the full correct plan for the following):


earlier workflow and operations are fine:

 Actors in the System
Citizen/User

Reports waste-related issues (e.g., uncollected garbage, overflowing bins).
Provides complaint details such as name, location, type of issue, and description.
Can track the complaint’s status (e.g., Pending, In Progress, Resolved).
Administrator

Manages employee and department details.
Reviews new complaints.
Assigns the complaint to a department (e.g., Waste Collection Department).
Allocates a vehicle and employee (driver or cleaner) for that route.
Monitors the progress of complaints and updates their resolution status.
Employee (Driver / Cleaner / Technician)

Logs in to view assigned routes or complaints.
Updates the status (e.g., Reached site, Collection done, Resolved).
Records departure and completion details.
System (WasteTrack Database)

Stores all user, employee, vehicle, department, route, and complaint data.
Maintains relationships between employees, vehicles, and routes.
Ensures accountability via timestamps and foreign key relations.
⚙️ Flow of Operations (Step-by-Step)
🏙️ 1. Citizen Submits Complaint
User fills a complaint form on the website (complaint.html).
Inputs: name, contact, location (area), type of issue, description, date.
Complaint is stored in the Complaint table with a default status = “Pending”.
🧾 2. Admin Reviews the Complaint
Admin dashboard lists all complaints.
Admin assigns the complaint to a Department (like Waste Collection or Recycling Unit).
🚛 3. Department Takes Charge
The assigned department checks which vehicle and employees are available.
Through the Assigned_to table, the admin links an Employee and Vehicle.
A route (in the Route table) corresponding to the complaint’s location is chosen.
The vehicle is linked to that route via Serves table.
🧍‍♂️ 4. Employee Executes the Task
Assigned employee logs in, sees the task (with location, vehicle ID, route).
Employee departs (departure_from logged in Assigned_to).
Once task is completed, status is updated to “Resolved”.
📊 5. Citizen Can Track Progress
The citizen can revisit the site and enter the complaint ID to track the current status.
They may also view resolved history.
🏁 6. Admin Verifies & Closes
Admin verifies the completion via proof (photo or report).
The complaint is marked as “Closed” and archived.

changes: 

show department names using dept id in complaint.html as a drop down menu in which under each depatment it should show locations/areas associated with the deparment

under employees table:
there should be email and password attribute for 1. managers(admins) of particular department, 2. Employees of particular department

views for different people:
1. for Employees of particular department there should be a page dedicated for them, joining tables waste_record, department, assigned_to showing appropriate data

2. for managers(admins) of particular department there should be a page dedicated for them, joining tables waste_record, department, assigned_to showing appropriate data


Views:

views that you gave is okay, and for all the views should be placed in their appropriate pages: 
Suggestion for 5 SQL Views
View Name	Description	SQL Example
v_pending_complaints	Show all pending complaints with route & employee	SELECT c.*, e.name AS employee_name, r.route_name FROM complaints c LEFT JOIN employee e ON c.assigned_emp=e.emp_id LEFT JOIN route r ON c.route_id=r.route_id WHERE c.status='Open';
v_vehicle_usage	Vehicle assignment count & current status	SELECT v.vehicle_no, COUNT(a.assign_id) AS total_assignments, v.status FROM vehicle v LEFT JOIN assigned_to a ON v.vehicle_id=a.vehicle_id GROUP BY v.vehicle_no;
v_department_summary	Total employees, total vehicles per department	SELECT d.name, COUNT(DISTINCT e.emp_id) AS total_employees, COUNT(DISTINCT v.vehicle_id) AS total_vehicles FROM department d LEFT JOIN employee e ON d.dept_id=e.dept_id LEFT JOIN vehicle v ON d.dept_id=v.dept_id GROUP BY d.dept_id;
v_waste_collection_stats	Avg. waste collected per route	SELECT r.route_name, AVG(w.weight_kg) AS avg_collected FROM waste_record w JOIN route r ON w.route_id=r.route_id GROUP BY r.route_name;
v_employee_performance	No. of complaints handled by employee	SELECT e.name, COUNT(c.complaint_id) AS complaints_handled FROM employee e LEFT JOIN complaints c ON e.emp_id=c.assigned_emp GROUP BY e.name;
Each of these views can be connected to a simple table in your frontend via /api/views/... endpoints.
















New plan:

Perfect 👏 — this is exactly how real-world full-stack projects evolve!
You now have a **defined workflow**, clear **actor-based separation (citizen, employee, manager)**, and refined **database design goals**.
Let’s update your **complete project development plan** (including the new logic, views, and frontend/backend structure).

---

# 🚀 **Final Project Plan — WasteTrack (Full Stack System)**

## 🧩 1️⃣ Project Overview

**Goal:**
To build a centralized platform for smart waste management where:

* Citizens report complaints.
* Admins (Managers of Departments) manage operations and assign work.
* Employees execute waste collection tasks and update their progress.
* The system ensures two-way sync between the frontend and the database.

---

## 👥 2️⃣ Actors & System Roles

| Actor                     | Role Description                                                                 | Access Page      |
| ------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| 👤 **Citizen**            | Can report complaints and track them.                                            | `complaint.html` |
| 🧑‍💼 **Manager (Admin)** | Manages employees, vehicles, and complaints for their department.                | `manager.html`   |
| 👷 **Employee**           | Sees assigned routes and tasks, updates completion and waste records.            | `employee.html`  |
| 🧠 **System (DB)**        | Handles relational logic between departments, employees, routes, and complaints. | —                |

---

## ⚙️ 3️⃣ System Flow (Step-by-Step Updated)

### 🏙️ 1. Citizen Submits Complaint

* Citizen opens `complaint.html`.
* Form includes:

  * `citizen_name`, `contact_no`, `location`, `description`
  * Dropdown: **Department → Locations (from department & route tables)**
* On submit → inserts into `complaints` table with status = `'Open'`.

### 🧾 2. Admin (Manager) Reviews Complaint

* `manager.html` shows:

  * All complaints filtered by department.
  * Option to assign employee and vehicle to each complaint.
  * Updates complaint status (e.g., "In Progress", "Resolved").
* Admin credentials stored in `Employee` table (with `email`, `password`, and role field).

### 🚛 3. Department Takes Charge

* Manager assigns employee + vehicle + route using:

  * `Assigned_to` and `Serves` tables.
* Department data fetched dynamically using department and route joins.

### 👷‍♂️ 4. Employee Executes the Task

* Employee logs in to `employee.html`.
* Sees:

  * Assigned route, vehicle, and waste collection info.
  * Form to log collected waste weight (insert into `waste_record`).
* Updates status (via `/api/assigned/update`).

### 📊 5. Citizen Tracks Progress

* Citizen can enter complaint ID to see:

  * Complaint status
  * Assigned department
  * Assigned employee

### 🏁 6. Admin Verifies & Closes

* After the employee marks the task as complete, admin verifies and updates complaint to `"Closed"`.

---
Workflow (with updates)

Citizen Submits Complaint

Fills complaint.html with name, contact, location, and issue description.

Selects Department (dropdown populated dynamically from Department table).

When a department is selected → display locations (routes) assigned to that department.

Complaint auto-gets status = 'Pending'.

Manager Reviews and Assigns

Manager logs in via email/password (from Employee table where job_title='Manager').

Manager dashboard:

Views all complaints of their department (JOIN Complaint, Department, Assigned_to).

Assigns available employee and vehicle to a complaint.

Links a route (from the selected department area).

Updates complaint status → “In Progress”.

Employee Executes Task

Employee logs in using email/password (from Employee table).

Sees assigned complaint(s) with vehicle and route details (via JOIN).

Updates progress:

Reached site

Collection done

Resolved

Citizen Tracks Complaint

Citizen visits “Track Complaint” page.

Enters complaint ID → Fetches status (Pending, In Progress, Resolved, Closed).

Manager Verifies & Closes

Manager reviews resolved tasks.

Marks complaint as Closed after verification.
---

## 🧠 5️⃣ SQL Views (Confirmed & Extended)

| View                         | Description                           | Joins & Data                      |
| ---------------------------- | ------------------------------------- | --------------------------------- |
| **v_pending_complaints**     | Pending complaints + employee + route | `Complaints + Employee + Route`   |
| **v_vehicle_usage**          | Vehicle assignment count              | `Vehicle + Assigned_to`           |
| **v_department_summary**     | Department-wise staff & vehicles      | `Department + Employee + Vehicle` |
| **v_waste_collection_stats** | Avg. waste collected per route        | `Waste_Record + Route`            |
| **v_employee_performance**   | Total complaints handled              | `Employee + Complaints`           |

✅ All these will be accessible via `/api/views/:name`
✅ Each view will have a **dedicated table section** in frontend pages.

---

## 🧱 6️⃣ Backend Architecture

**File Structure**

```
source/
  backend/
    db.js
    server.js
    routes/
       complaints.js
       employees.js
       departments.js
       assigned.js
       waste.js
       views.js
```

### Key API Endpoints

| Endpoint               | Method   | Description                   |
| ---------------------- | -------- | ----------------------------- |
| `/api/complaints`      | GET/POST | Fetch or add complaints       |
| `/api/departments`     | GET      | Fetch all departments         |
| `/api/routes/:dept_id` | GET      | Get routes under a department |
| `/api/employees/login` | POST     | Login (manager or employee)   |
| `/api/views/:viewname` | GET      | Fetch SQL view data           |
| `/api/waste`           | POST     | Add waste record              |
| `/api/assigned/update` | POST     | Update assigned task status   |

---

## 💻 7️⃣ Frontend Structure & Responsibilities

**Directory**

```
source/
  complaint.html     ← Citizen portal
  manager.html       ← Admin dashboard (Manager)
  employee.html      ← Employee dashboard
  stats.html         ← Analytics (for global view)
  style.css
```

### 🔹 `complaint.html`

* Dropdowns for department and associated route/location.
* Shows complaint submission + list of complaints.
* Linked to `/api/departments` and `/api/routes/:dept_id`.

### 🔹 `manager.html`

* Login for manager (via `Employee` role = 'Manager').
* Table: All complaints under that department.
* Actions:

  * Assign employee and vehicle.
  * Mark complaint status.
* Displays joined data from `v_pending_complaints`, `v_department_summary`.

### 🔹 `employee.html`

* Login for employee (`Employee` role = 'Employee').
* Shows assigned routes and vehicles.
* Allows to insert `waste_record` entries.
* Displays data from joined view of `Waste_Record`, `Department`, `Assigned_to`.

### 🔹 `stats.html`

* Shows analytics using SQL views (`v_vehicle_usage`, `v_waste_collection_stats`, `v_employee_performance`).
* Could include charts using **Chart.js**.

---

## 🎨 8️⃣ UI/UX Plan

Keep the interface **clean and modern**:

* Use **CSS Grid / Flexbox** layout.
* Color palette: Green (#4CAF50), White (#FFFFFF), Gray (#F1F1F1).
* Buttons with hover effects and consistent card layouts.
* Use `<select>` dropdowns dynamically loaded from backend.
* Add **popup alerts** after successful data insertions.

---

## 📈 9️⃣ Implementation Phases (Timeline)

| Phase       | Duration | Key Deliverables                                                 |
| ----------- | -------- | ---------------------------------------------------------------- |
| **Phase 1** | Day 1–2  | Update DB schema (Employee, Complaints). Create all SQL Views.   |
| **Phase 2** | Day 3–4  | Add backend routes for all modules. Test API in Postman.         |
| **Phase 3** | Day 5–6  | Build frontend pages (Citizen, Manager, Employee). Connect APIs. |
| **Phase 4** | Day 7    | Add `stats.html` + integrate SQL views (Analytics).              |
| **Phase 5** | Day 8    | Final UI polish, testing, and presentation prep.                 |

---

## 🔥 10️⃣ Opinion — Why This Plan Works

* ✅ Clearly maps **frontend–backend–DB relationships**.
* ✅ Proper **role-based separation** makes it realistic and professional.
* ✅ Uses **SQL Views** smartly to demonstrate join/aggregate logic.
* ✅ Modular backend ensures easy debugging and maintainability.
* ✅ Visually appealing, functional, and aligned with your marks criteria.

---



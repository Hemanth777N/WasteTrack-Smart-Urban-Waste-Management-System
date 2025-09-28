***

# 7-Step ER-to-Relational Mapping Process (Company Database Example) 🏛️

This process systematically converts the high-level concepts of the ER model into the structured tables (relations) of a relational database, ensuring data integrity and normalization.

---

## Step 1: Mapping Regular (Strong) Entity Sets

Each **Strong Entity** in the ER model is directly converted into a new **Relational Table**.

| Concept | Action | Example: `EMPLOYEE` |
| :--- | :--- | :--- |
| **Simple Attributes** | Become columns in the table. | `Emp_ID`, `Salary` |
| **Composite Attributes** | Are **flattened** by using their simple component attributes as columns. | `Name` (composite) $\rightarrow$ `Fname`, `Minit`, `Lname` |
| **Primary Key** | The entity's primary key is designated as the table's primary key (PK). | $\underline{\text{Emp\_ID}}$ is the PK. |

### $\rightarrow$ Resulting Table: `EMPLOYEE`

| Column Name | Type/Key | Description |
| :--- | :--- | :--- |
| $\underline{\text{Emp\_ID}}$ | **PK** | Unique identifier for the employee. |
| Fname, Minit, Lname | | Components of the `Name` attribute. |
| Street, City, State, Zip | | Components of the `Address` attribute. |
| Salary | | Employee's salary. |

---

## Step 2: Mapping Weak Entity Sets

A **Weak Entity** is mapped to a new table, but its primary key is composite and relies on the strong (identifying) entity.

| Concept | Action | Example: `DEPENDENT` |
| :--- | :--- | :--- |
| **Table Creation** | Create a new table for the weak entity. | **`DEPENDENT`** table. |
| **Partial Key** | Include the weak entity's partial key. | `Dependent_Name` |
| **Foreign Key (FK)** | Include the **Primary Key of the identifying strong entity** (e.g., `Emp_ID`). | $\text{Emp\_ID}$ is included. |
| **Primary Key (PK)** | The PK is the **combination** of the FK and the partial key. | $\underline{\text{Emp\_ID}}$, $\underline{\text{Dependent\_Name}}$ |

### $\rightarrow$ Resulting Table: `DEPENDENT`

| Column Name | Type/Key | Constraint |
| :--- | :--- | :--- |
| $\underline{\text{Emp\_ID}}$ | **PK, FK** | References $\text{EMPLOYEE}(\text{Emp\_ID})$. |
| $\underline{\text{Dependent\_Name}}$ | **PK** | Partial key. |
| Relationship | | The dependent's relationship to the employee. |

---

## Step 3: Mapping Binary 1:1 Relationships

The relationship is represented by adding a **Foreign Key** to one of the tables.

| Concept | Action | Example: `MANAGES` (1:1) |
| :--- | :--- | :--- |
| **Key Placement** | Place the PK of one table (e.g., `EMPLOYEE.Emp_ID`) as an **FK** in the other table (e.g., `DEPARTMENT`). | Add $\text{Mgr\_Emp\_ID}$ to `DEPARTMENT`. |
| **Choice Rule** | Choose the side with **Total Participation** to host the FK, or the side that minimizes $\text{NULL}$ values. | Assuming $\text{DEPARTMENT}$ must have a manager. |
| **1:1 Enforcement** | Add a **UNIQUE constraint** on the FK to prevent it from linking to more than one record. | $\text{Mgr\_Emp\_ID}$ must be $\text{UNIQUE}$. |

### $\rightarrow$ Affected Table: `DEPARTMENT`

| Column Name | Type/Key | Constraint |
| :--- | :--- | :--- |
| $\underline{\text{Dept\_ID}}$ | **PK** | |
| Dept\_Name | | |
| Mgr\_Emp\_ID | **FK** | $\text{REFERENCES}$ $\text{EMPLOYEE}(\text{Emp\_ID})$; **UNIQUE**. |

---

## Step 4: Mapping Binary 1:N Relationships

The relationship is represented by adding a **Foreign Key** to the relation on the "many" side.

| Concept | Action | Example: `WORKS\_FOR` (1:N) |
| :--- | :--- | :--- |
| **Key Placement** | The PK of the **"one" side** (`DEPARTMENT.Dept_ID`) is placed as an **FK** in the table on the **"many" side** (`EMPLOYEE`). | Add $\text{Dept\_ID}$ to `EMPLOYEE`. |
| **Rationale** | Ensures that every employee (the "many" side) can only reference a single, valid department (the "one" side). | $\text{Dept\_ID}$ in $\text{EMPLOYEE}$ is not $\text{UNIQUE}$. |

### $\rightarrow$ Affected Table: `EMPLOYEE`

| Column Name | Type/Key | Constraint |
| :--- | :--- | :--- |
| $\underline{\text{Emp\_ID}}$ | **PK** | |
| $\dots$ | | |
| Dept\_ID | **FK** | $\text{REFERENCES}$ $\text{DEPARTMENT}(\text{Dept\_ID})$. |

---

## Step 5: Mapping Binary M:N Relationships

A **Many-to-Many** relationship is converted into a new, dedicated **Junction Table** (or Associative Relation).

| Concept | Action | Example: `WORKS\_ON` (M:N) |
| :--- | :--- | :--- |
| **Table Creation** | Create a new table to represent the relationship. | **`WORKS\_ON`** table. |
| **Foreign Keys** | Include the PKs of **both** participating entities as FKs. | $\text{Emp\_ID}$ and $\text{Proj\_ID}$ are included. |
| **Primary Key (PK)** | The PK is the **combination** of the two FKs. | $\underline{\text{Emp\_ID}}$, $\underline{\text{Proj\_ID}}$ |
| **Relationship Attributes**| Any attributes belonging to the relationship are included as columns. | $\text{Hours}$ is included. |

### $\rightarrow$ Resulting Table: `WORKS_ON`

| Column Name | Type/Key | Constraint |
| :--- | :--- | :--- |
| $\underline{\text{Emp\_ID}}$ | **PK, FK** | $\text{REFERENCES}$ $\text{EMPLOYEE}(\text{Emp\_ID})$. |
| $\underline{\text{Proj\_ID}}$ | **PK, FK** | $\text{REFERENCES}$ $\text{PROJECT}(\text{Proj\_ID})$. |
| Hours | | Hours worked on the project. |

---

## Step 6: Mapping Multivalued Attributes

A **Multivalued Attribute** is converted into a new, separate relation to enforce First Normal Form (1NF).

| Concept | Action | Example: `DEPARTMENT` $\rightarrow$ `Locations` |
| :--- | :--- | :--- |
| **Table Creation** | Create a new table for the attribute. | **`DEPT\_LOCATIONS`** table. |
| **Attribute Value** | Include the multivalued attribute itself as a column. | $\text{Location}$ |
| **Foreign Key (FK)** | Include the PK of the entity it belongs to. | $\text{Dept\_ID}$ is included. |
| **Primary Key (PK)** | The PK is the **combination** of the FK and the attribute value. | $\underline{\text{Dept\_ID}}$, $\underline{\text{Location}}$ |

### $\rightarrow$ Resulting Table: `DEPT_LOCATIONS`

| Column Name | Type/Key | Constraint |
| :--- | :--- | :--- |
| $\underline{\text{Dept\_ID}}$ | **PK, FK** | $\text{REFERENCES}$ $\text{DEPARTMENT}(\text{Dept\_ID})$. |
| $\underline{\text{Location}}$ | **PK** | The specific location address. |

---

## Step 7: Mapping Ternary and Higher-Order Relationships

Any relationship involving **three or more entities** is mapped to a new, dedicated relation.

| Concept | Action | Example: `SUPPLIES` (Ternary) |
| :--- | :--- | :--- |
| **Table Creation** | Create a new table for the ternary relationship. | **`SUPPLIES`** table. |
| **Foreign Keys** | Include the PKs of **all** participating entities as FKs. | $\text{Supplier\_ID}$, $\text{Part\_Num}$, $\text{Proj\_ID}$ |
| **Primary Key (PK)** | The PK is typically the **combination** of all participating FKs. | $\underline{\text{Supplier\_ID}}$, $\underline{\text{Part\_Num}}$, $\underline{\text{Proj\_ID}}$ |

### $\rightarrow$ Resulting Table: `SUPPLIES`

| Column Name | Type/Key | Constraint |
| :--- | :--- | :--- |
| $\underline{\text{Supplier\_ID}}$ | **PK, FK** | $\text{REFERENCES}$ $\text{SUPPLIER}$. |
| $\underline{\text{Part\_Num}}$ | **PK, FK** | $\text{REFERENCES}$ $\text{PART}$. |
| $\underline{\text{Proj\_ID}}$ | **PK, FK** | $\text{REFERENCES}$ $\text{PROJECT}$. |
| Quantity\_Supplied | | Attribute of the relationship. |
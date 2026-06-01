# Techno Ammar Municipality System - Modular SRS Breakdown

**System Overview**: A comprehensive municipality service management system supporting citizens, employees, department managers, and administrators. The system handles service requests, utility billing, damage assessments, complaints, and workflow management with role-based access control.

---

## 📋 MODULE 1: AUTHENTICATION & USER MANAGEMENT

### Purpose
Manage user registration, authentication, authorization, and account lifecycle across all user roles.

### Actors Involved
- **Citizen**: Self-register, login, password recovery
- **Employee**: Login via admin/manager creation
- **Department Manager**: Login via admin creation
- **Admin**: Login via admin creation

### Data Model

```
User Entity:
- userId (PK)
- idNumber (unique) - National/municipal ID
- email
- phoneNumber
- password (hashed)
- role (enum: CITIZEN, EMPLOYEE, DEPARTMENT_MANAGER, ADMIN)
- status (enum: PENDING_VERIFICATION, ACTIVE, INACTIVE, DEACTIVATED)
- createdAt
- updatedAt
- lastLoginAt
- jwtToken (current session)
```

### Functional Requirements

**FR1: Citizen Registration**
- Citizens submit: ID number, personal information (name, email, phone), contact info
- System validates data completeness and format
- Citizens upload identity verification documents
- System creates account with status "Unverified" (PENDING_VERIFICATION)
- Admin reviews and either verifies or rejects

**FR2: Authentication (All Users)**
- Users enter ID number + password on login page
- System validates credentials against User table
- System checks account status (must be ACTIVE)
- System generates secure JWT token (expires after inactivity)
- System redirects to role-based dashboard:
  - Citizen → Citizen Dashboard
  - Employee → Task Management Dashboard
  - Department Manager → Department Dashboard
  - Admin → Admin Dashboard

**FR3: Authorization & Role-Based Access Control (RBAC)**
- System enforces role-based access control
- Each role has specific permissions:
  - **CITIZEN**: View services, submit requests, pay bills, view complaints
  - **EMPLOYEE**: View tasks, process service requests, manage documents
  - **DEPARTMENT_MANAGER**: Manage employees/sections, monitor performance
  - **ADMIN**: Full system access, manage all entities

**FR4: Password Management**
- Users can reset password via: "Forgot Password" flow
- System sends verification code to registered phone
- User enters code + new password
- System validates code (time-limited, single-use)
- Previous password invalidated after reset

**FR5: Session Management**
- System generates JWT token upon successful login
- Token stored in browser/client
- Token automatically expires after inactivity (timeout value configurable)
- Users can logout manually → token cleared → session terminated
- Logout redirects to login page
- Protected resources not accessible without valid token

**FR6: Admin User Management**
- Admin can create, update, deactivate users
- Admin assigns roles and permissions
- Admin can view user list with search/filter
- Admin logs all user management actions

### Use Cases
- **UC-S01**: Login
- **UC-S02**: Logout
- **UC-S03**: Recover Password
- **UC-C01**: Register (Citizen)
- **UC-A05**: View Employees
- **UC-A06**: Add Employee
- **UC-A07**: Update Employee
- **UC-A08**: Deactivate Employee

### Non-Functional Requirements
- **NFR 3.01**: Role-based access control enforced
- **NFR 3.02**: Passwords encrypted, sensitive data encrypted in transit & at rest
- **NFR 7.01**: All login/logout/password reset activities logged

### Dependencies
- None (foundational module)

### API Endpoints (Backend)
```
POST   /auth/register          - Citizen registration
POST   /auth/login             - Login (all users)
POST   /auth/logout            - Logout
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Complete password reset
POST   /auth/verify-token      - Validate JWT token
GET    /users                  - Admin: List users
POST   /users                  - Admin: Create user
PUT    /users/{id}             - Admin: Update user
DELETE /users/{id}             - Admin: Deactivate user
```

---

## 📋 MODULE 2: CITIZEN PROFILE & ACCOUNT MANAGEMENT

### Purpose
Manage citizen profile information, account lifecycle, and notification preferences.

### Data Model

```
Citizen Entity:
- citizenId (PK) / linked to userId
- idNumber (unique)
- fullName
- email
- phoneNumber
- address
- dateOfBirth
- idVerificationDocument (file path/reference)
- accountStatus (enum: PENDING_VERIFICATION, ACTIVE, INACTIVE)
- verificationDate
- createdAt
- updatedAt
```

### Functional Requirements

**FR1: View Citizen Profile**
- Citizens can view their profile information
- Includes: name, ID, contact info, account status, verification status

**FR2: Edit Citizen Profile**
- Citizens can update contact information
- System validates changes
- Updates are logged for audit trail

**FR3: Account Verification (Admin)**
- Admin views citizen registration requests
- Admin can see: citizen details, verification documents, submission date
- Admin either verifies (ACTIVE) or rejects (rejected reason recorded)
- System notifies citizen of verification decision
- Rejection includes reason for re-submission

**FR4: Deactivate Citizen Account (Admin)**
- Admin can deactivate active citizen accounts
- Deactivated status prevents login and service usage
- Action logged with admin ID and timestamp
- Citizen receives notification

**FR5: Account Deletion (Consideration)**
- Citizens/admin may request account deletion
- System marks as INACTIVE (soft delete)
- Data retained for audit purposes

### Use Cases
- **UC-C01**: Register
- **UC-A01**: View Citizens
- **UC-A02**: Review Citizen Profile
- **UC-A03**: Verify/Reject Citizen Account
- **UC-A04**: Deactivate Citizen

### Dependencies
- **Depends On**: Module 1 (Authentication & User Management)
- **Used By**: Module 4 (Service Requests), Module 7 (Notifications)

### API Endpoints
```
GET    /citizens/profile       - Get own profile
PUT    /citizens/profile       - Update own profile
GET    /admin/citizens         - Admin: List citizens
GET    /admin/citizens/{id}    - Admin: Get citizen details
POST   /admin/citizens/{id}/verify - Admin: Verify citizen
POST   /admin/citizens/{id}/reject - Admin: Reject citizen
POST   /admin/citizens/{id}/deactivate - Admin: Deactivate
```

---

## 📋 MODULE 3: ORGANIZATIONAL STRUCTURE MANAGEMENT

### Purpose
Define and manage the municipal organizational hierarchy: departments, sections, and role assignments.

### Data Model

```
Department Entity:
- departmentId (PK)
- name (unique)
- description
- createdAt
- updatedAt
- createdBy (userId)

Section Entity:
- sectionId (PK)
- departmentId (FK)
- name (unique within department)
- description
- createdAt
- updatedAt
- createdBy (userId)

EmployeeRole Entity:
- roleId (PK)
- roleName (EMPLOYEE, DEPARTMENT_MANAGER, ADMIN)
- permissions (list of permission codes)

Employee Entity:
- employeeId (PK) / linked to userId
- departmentId (FK)
- sectionId (FK)
- employeeIdNumber (unique)
- fullName
- contactInfo
- role (FK to EmployeeRole)
- status (enum: ACTIVE, INACTIVE)
- assignedDate
- createdAt
- updatedAt
```

### Functional Requirements

**FR1: Manage Departments (Admin)**
- Admin can create new departments with name and description
- Admin can view all departments
- Admin can edit department details
- Admin can delete departments only if no employees/sections/tasks depend on them
- System validates department name uniqueness
- All actions logged

**FR2: Manage Sections (Admin)**
- Admin can create sections within departments
- Admin can view all sections, filtered by department
- Admin can edit section details
- Admin can delete sections only if no employees/tasks assigned
- System validates section name uniqueness within department
- All actions logged

**FR3: Manage Department Employees (Department Manager)**
- Department manager can view employees in their department with sections displayed
- Manager can add new employees: specify ID, name, contact info, select section
- Manager can edit employee section assignment
- Manager can deactivate employee accounts (prevents login)
- System validates employee ID uniqueness
- All actions logged with manager ID and timestamp

**FR4: Manage Employees (Admin)**
- Admin can view all employees with advanced filters: department, section, role, status
- Admin can add employees (same as manager, but system-wide)
- Admin can update employee role, department, or section
- Admin can deactivate employee accounts
- System validates role validity and department/section mapping
- All actions logged

**FR5: View & Assign Roles**
- System defines roles: EMPLOYEE, DEPARTMENT_MANAGER, ADMIN
- Each role linked to permission set
- Admin assigns roles during employee creation/update
- Roles determine access to features and dashboards

### Use Cases
- **UC-A09**: Manage Departments (Add/Edit/Delete)
- **UC-A09.1 to UC-A09.3**: Department CRUD
- **UC-A10**: Manage Sections (Add/Edit/Delete)
- **UC-A10.1 to UC-A10.3**: Section CRUD
- **UC-M01**: Manage Department Employees
- **UC-M01.1 to UC-M01.3**: Employee CRUD (Manager)
- **UC-A05 to UC-A08**: Employee Management (Admin)

### Non-Functional Requirements
- **NFR 5.01**: Support scalability for many departments/sections
- **NFR 7.01**: All CRUD operations logged with actor, action, timestamp

### Dependencies
- **Depends On**: Module 1 (Authentication & User Management)
- **Used By**: Module 4 (Service Requests), Module 5 (Task Management)

### API Endpoints
```
GET    /departments            - Admin: List departments
POST   /departments            - Admin: Create department
PUT    /departments/{id}       - Admin: Update department
DELETE /departments/{id}       - Admin: Delete department

GET    /sections               - Admin: List sections
POST   /sections               - Admin: Create section
PUT    /sections/{id}          - Admin: Update section
DELETE /sections/{id}          - Admin: Delete section

GET    /employees              - Admin/Manager: List employees
POST   /employees              - Admin/Manager: Add employee
PUT    /employees/{id}         - Admin/Manager: Update employee
POST   /employees/{id}/deactivate - Admin/Manager: Deactivate

GET    /roles                  - Admin: List roles and permissions
POST   /roles                  - Admin: Create custom role
```

---

## 📋 MODULE 4: SERVICES & SERVICE CATALOG MANAGEMENT

### Purpose
Define municipality services, their requirements, fees, workflows, and enable citizens to view and understand services.

### Data Model

```
MunicipalityService Entity:
- serviceId (PK)
- serviceName (unique)
- description
- departmentId (FK) - responsible department
- fee (decimal)
- estimatedProcessingDays (int)
- status (enum: DRAFT, PUBLISHED, ARCHIVED)
- createdBy (userId)
- createdAt
- publishedAt
- updatedAt

RequiredDocument Entity:
- documentId (PK)
- serviceId (FK)
- documentName
- type (enum: MANDATORY, OPTIONAL)
- description
- createdAt

ServiceWorkflowTask Entity:
- taskId (PK)
- serviceId (FK)
- taskName
- taskOrder (int) - sequence in workflow
- departmentId (FK) - which department handles this task
- sectionId (FK) - which section handles this task
- estimatedTimeHours (int)
- description
- createdAt

ServiceConfiguration Entity:
- configId (PK)
- serviceId (FK)
- requiredDocuments[] (list of documentIds)
- workflowTasks[] (list of taskIds in order)
- createdAt
- updatedAt
- createdBy (userId)
```

### Functional Requirements

**FR1: View Municipality Services (Citizen)**
- Citizens can browse all published services
- System displays: service name, department, fee, estimated processing time
- Citizens can view detailed information for each service
- Includes: description, requirements, required documents list, fees, estimated time
- Service list is read-only for citizens

**FR2: Create Service (Admin)**
- Admin clicks "Add Service"
- Admin enters: service name, description, fee, responsible department
- Admin must configure required documents and workflow before publishing
- System validates service name uniqueness
- Service created with status DRAFT

**FR3: Configure Required Documents (Admin)**
- Admin navigates to "Required Documents" section of service config
- Admin can add documents: document name, type (Mandatory/Optional)
- Admin can delete documents
- Changes saved when service configuration is published

**FR4: Configure Service Workflow (Admin)**
- Admin navigates to "Workflow Tasks" section
- Admin adds workflow tasks in sequence:
  - Task name
  - Responsible department and section
  - Estimated time in hours
  - Task order (sequence number)
- Admin can edit task order using up/down arrows
- System requires at least one task per service
- At least one task must be mandatory for service completion

**FR5: Save/Publish Service Configuration (Admin)**
- Admin clicks "Save" or "Publish"
- System validates:
  - Basic info (name, description, fee)
  - Document names populated
  - At least one workflow task defined
  - Valid department/section mappings
  - No duplicate service names
- If valid: service status → PUBLISHED (visible to citizens)
- If invalid: display errors, prevent save
- Action logged with admin ID and timestamp

**FR6: Edit Service (Admin)**
- Admin clicks "Edit" on published service
- Admin can modify: name, description, fee, department, documents, workflow
- System re-validates all configurations
- Changes only saved if validation passes
- Updated timestamp recorded

**FR7: Delete Service (Admin)**
- Admin can delete service only if NO active service requests exist
- System checks for active requests before deletion
- If dependencies exist: block deletion with error message
- If valid: delete service and related documents/tasks
- Action logged

**FR8: View All Services (Admin)**
- Admin can view complete service list with: name, department, status (Draft/Published/Archived)
- Admin can search and filter services
- Admin can access CRUD actions from list

### Use Cases
- **UC-C02**: Browse Municipality Services
- **UC-C03**: View Service Details
- **UC-A11**: View Municipality Services (Admin)
- **UC-A12**: Add Service
- **UC-A13**: Update Service
- **UC-A14**: Delete Service
- **UC-A15**: Configure Required Documents
- **UC-A16**: Configure Service Workflow
- **UC-A17**: Save/Publish Service Configuration

### Non-Functional Requirements
- **NFR 4.01**: Service catalog UI intuitive and non-technical user friendly
- **NFR 5.01**: Support many services and workflow tasks
- **NFR 7.01**: All service configuration changes logged
- **NFR 8.01**: Data consistency across service, documents, and workflow definitions

### Dependencies
- **Depends On**: Module 1 (Authentication), Module 3 (Organizational Structure)
- **Used By**: Module 5 (Service Requests & Workflows)

### API Endpoints
```
GET    /services               - Citizen: List published services
GET    /services/{id}          - Citizen: Get service details

GET    /admin/services         - Admin: List all services
POST   /admin/services         - Admin: Create service
PUT    /admin/services/{id}    - Admin: Update service
DELETE /admin/services/{id}    - Admin: Delete service

GET    /admin/services/{id}/documents - Admin: Get required documents
POST   /admin/services/{id}/documents - Admin: Add document
DELETE /admin/services/{id}/documents/{docId} - Admin: Delete document

GET    /admin/services/{id}/workflow - Admin: Get workflow tasks
POST   /admin/services/{id}/workflow - Admin: Add workflow task
PUT    /admin/services/{id}/workflow/{taskId} - Admin: Edit workflow task
DELETE /admin/services/{id}/workflow/{taskId} - Admin: Delete workflow task
```

---

## 📋 MODULE 5: SERVICE REQUESTS & WORKFLOW MANAGEMENT

### Purpose
Enable citizens to request services, manage document uploads/payments, and track request lifecycle through multi-step workflows.

### Data Model

```
ServiceRequest Entity:
- requestId (PK)
- citizenId (FK)
- serviceId (FK)
- status (enum: SUBMITTED, IN_PROGRESS, PENDING_INFORMATION, APPROVED, REJECTED, APPEALED)
- submissionDate
- completionDate
- paymentStatus (enum: NOT_REQUIRED, PENDING_VERIFICATION, PAID)
- createdAt
- updatedAt
- currentTaskId (FK) - task currently being processed

RequestTask Entity:
- taskId (PK)
- requestId (FK)
- serviceWorkflowTaskId (FK) - references the workflow task definition
- taskName
- taskOrder (int)
- departmentId (FK)
- sectionId (FK)
- assignedEmployeeId (FK) - null if unassigned
- status (enum: BACKLOG, ASSIGNED, IN_PROGRESS, PENDING_INFO, CORRECTION_DONE, APPEALED, COMPLETED, FAILED, WAITING_CORRECTION, RETURNED_FOR_EDITION)
- estimatedTimeHours (int)
- assignedDate
- completedDate
- createdAt
- updatedAt

RequestDocument Entity:
- documentId (PK)
- requestId (FK)
- taskId (FK, nullable) - document can be for whole request or specific task
- documentName
- fileType
- filePath
- documentCategory (enum: CITIZEN_UPLOADED, INTERNAL, RESULT)
- uploadedDate
- uploadedBy (userId)
- createdAt

RequestPayment Entity:
- paymentId (PK)
- requestId (FK)
- amount
- paymentMethod
- transferNumber
- paymentProofFilePath
- paymentStatus (enum: PENDING_VERIFICATION, VERIFIED, FAILED)
- paymentDate
- verificationDate
- verifiedBy (userId, nullable)
- createdAt

RequestActivity Entity:
- activityId (PK)
- requestId (FK)
- taskId (FK, nullable)
- actorId (FK) - userId who performed action
- actionType (enum: SUBMITTED, STARTED_TASK, COMPLETED_TASK, REJECTED_TASK, ASKED_FOR_INFO, APPEALED, CORRECTION_REQUESTED)
- description
- timestamp
- createdAt
```

### Functional Requirements

**FR1: Submit Service Request (Citizen)**
- Citizen selects a service and clicks "Request Service"
- System displays service request form with required fields based on service config
- Citizen can upload required documents (Mandatory marked clearly)
- If service has fee: system includes payment step
- Citizen submits completed form
- System validates:
  - All mandatory documents uploaded
  - File types/sizes valid (if payment: transfer number, proof uploaded)
- System creates ServiceRequest with status SUBMITTED
- System creates RequestTask records for each workflow task
- First task status set to BACKLOG (awaiting assignment)
- All subsequent tasks status set to BACKLOG
- Citizen receives confirmation with request ID
- Employee in first task's section receives notification
- Activity logged

**FR2: Upload Documents (Citizen & Employee)**
- **Citizen**: During request submission, upload required documents
- **Employee**: Upload internal documents or task result documents
- System validates: file type, file size (limits configurable)
- Files stored securely with paths referenced in RequestDocument
- Document category recorded (CITIZEN_UPLOADED, INTERNAL, RESULT)
- Upload action logged with uploader ID and timestamp

**FR3: Pay Service Fee (Citizen)**
- If service has fee: after document upload, citizen proceeds to payment
- Citizen enters:
  - Transfer number (bank transaction reference)
  - Payment method (enum: BANK_TRANSFER, ONLINE_PAYMENT, CASH)
  - Proof of payment (receipt image/PDF)
- System creates RequestPayment record
- Payment status set to PENDING_VERIFICATION
- RequestPayment.paymentStatus updated
- Citizen notified: "Payment received, awaiting verification"
- Admin/finance department notified to verify payment
- System NOT auto-complete request until payment verified

**FR4: Verify Payment (Admin/Finance)**
- Admin views pending payment requests
- Admin reviews transfer number and proof
- Admin either:
  - **Approves**: Sets paymentStatus to VERIFIED, updates request status
  - **Rejects**: Sets paymentStatus to FAILED, notifies citizen to resubmit
- Verification timestamp recorded

**FR5: Track Service Request (Citizen)**
- Citizen opens "My Requests" page
- System displays all submitted requests with:
  - Request ID
  - Service name
  - Current status
  - Submission date
  - Progress indicator
- Citizen can click request to view detailed tracking

**FR6: Track Service Request Detail (Citizen)**
- Citizen selects specific request
- System displays:
  - Current status
  - Timeline/workflow steps (visual)
  - Current task being processed
  - Assigned employee name (if available)
  - All uploaded documents (with download option)
  - Complete activity history (chronological log)
  - Next expected steps
- Read-only view for citizen

**FR7: Request Additional Information (Employee)**
- During task processing, employee can request more documents/info from citizen
- Employee clicks "Request Additional Documents"
- Employee specifies: information needed, optional instructions
- System sets task status to PENDING_INFO
- System updates request status to PENDING_INFO
- Citizen receives notification with request details
- Activity logged

**FR8: Respond to Information Request (Citizen)**
- Citizen notified of PENDING_INFO status
- Citizen opens request and uploads additional documents
- System validates files
- System stores documents linked to request
- System updates request status to SUBMITTED (or IN_PROGRESS, depending on workflow)
- Assigned employee notified that documents received
- Activity logged

**FR9: Request Task Correction (Employee)**
- Employee completes task but realizes previous employee's work has issues
- Employee clicks "Request Correction"
- System sets current task status to WAITING_CORRECTION
- System sets previous task status to RETURNED_FOR_EDITION
- Previous employee receives notification
- Activity logged in both tasks' histories

**FR10: Approve Task (Employee)**
- Employee completes task work and uploads result documents
- Employee clicks "Approve" or "Complete Task"
- System validates: documents uploaded if required
- System sets task status to COMPLETED
- System checks: is this the final required task?
  - **If YES**: Sets request status to APPROVED, notifies citizen
  - **If NO**: Automatically assigns next task (UC_AUTO_ASSIGN_TASK)
- Activity logged

**FR11: Reject Task (Employee)**
- Employee determines task cannot be completed (invalid data, impossible requirement)
- Employee clicks "Reject Task"
- Employee provides rejection reason
- System sets task status to FAILED
- System sets request status to REJECTED
- System terminates all subsequent unstarted tasks
- Citizen receives notification with rejection reason
- Appeal option becomes available for citizen
- Activity logged

**FR12: Appeal Rejected Request (Citizen)**
- Citizen receives request rejection notification
- Citizen clicks "Appeal" on request detail page
- Citizen submits appeal with supporting notes/documents
- System creates appeal record linked to request
- System sets request status to APPEALED
- Responsible department/employee receives notification
- Activity logged

**FR13: Process Appeal (Employee/Manager)**
- Employee reviews appeal information
- Employee selects either:
  - **Accept Appeal**: Request status → IN_PROGRESS, task status → IN_PROGRESS (restart)
  - **Reject Appeal**: Request status → FINAL_REJECTION, task status → FAILED
- Activity logged
- Citizen notified of appeal decision

**FR14: Auto-Assign Next Task**
- When task completed, system checks workflow
- System automatically creates next task in sequence (if exists)
- Assigns to first available employee in responsible section
- **Alternative**: Task created in BACKLOG, awaiting section employee assignment
- Next employee receives notification

**FR15: Request Status Transitions (System State Machine)**
- **SUBMITTED**: Initial state when citizen submits
- **IN_PROGRESS**: When first task assigned and employee starts work
- **PENDING_INFORMATION**: When employee requests additional info
- **APPROVED**: When all required tasks completed
- **REJECTED**: When any task rejected
- **APPEALED**: When citizen appeals rejection
- **FINAL_REJECTION**: When appeal rejected

### Use Cases
- **UC-C04**: Submit Service Request
- **UC-C05**: Pay Service Fee
- **UC-C06**: Track Service Requests
- **UC-C07**: Track Service Request Detail
- **UC-C08**: Respond to Required Document Request
- **UC-C09**: Appeal Rejected Request
- **UC-E05**: Request Additional Documents
- **UC-E08**: Return Task to Previous Employee
- **UC-E09**: Approve Task
- **UC-E10**: Reject Task
- **UC-E11**: Process Appeal

### Non-Functional Requirements
- **NFR 1.01**: System responds to status transitions within 3 seconds
- **NFR 8.01**: Data consistency across request, tasks, documents, payments
- **NFR 7.01**: Complete audit trail of all transitions and actions
- **NFR 7.02**: Traceability of request state changes

### Dependencies
- **Depends On**: Module 1 (Auth), Module 2 (Citizen), Module 3 (Org Structure), Module 4 (Services), Module 6 (Task Management)
- **Used By**: Module 6 (Task Management), Module 7 (Notifications), Module 8 (Audit Logging)

### API Endpoints
```
POST   /requests               - Citizen: Create service request
PUT    /requests/{id}/submit   - Citizen: Submit request
POST   /requests/{id}/payment  - Citizen: Pay service fee
GET    /requests               - Citizen: List own requests
GET    /requests/{id}          - Citizen: Get request details
GET    /requests/{id}/history  - Citizen: Get activity history

POST   /requests/{id}/documents - Citizen/Employee: Upload document
DELETE /requests/{id}/documents/{docId} - Delete document
GET    /requests/{id}/documents - Get documents for request

POST   /requests/{id}/appeal   - Citizen: Appeal rejection
POST   /requests/{id}/appeal/process - Employee: Process appeal

GET    /admin/requests         - Admin: List all requests
GET    /admin/requests/payments - Admin: List pending payments
PUT    /admin/requests/{id}/verify-payment - Admin: Verify payment
```

---

## 📋 MODULE 6: TASK MANAGEMENT & WORKFLOW PROCESSING

### Purpose
Enable employees to view, manage, and process workflow tasks for service requests. Includes task assignment, document handling, and status transitions.

### Data Model
*(Inherits RequestTask from Module 5)*

```
RequestTask (revisited):
- taskId (PK)
- requestId (FK)
- taskName
- taskOrder (int)
- departmentId (FK)
- sectionId (FK)
- assignedEmployeeId (FK, nullable)
- status (enum: BACKLOG, ASSIGNED, IN_PROGRESS, PENDING_INFO, WAITING_CORRECTION, RETURNED_FOR_EDITION, CORRECTION_DONE, APPEALED, COMPLETED, FAILED)
- estimatedTimeHours
- assignedDate
- completedDate
- createdAt
- updatedAt

KanbanBoard Column Mapping:
- Backlog → BACKLOG tasks (no assignment)
- Assigned → ASSIGNED tasks (assigned but not started)
- In Progress → IN_PROGRESS tasks (actively being worked)
- Edition Needed → RETURNED_FOR_EDITION (correction requested)
- Edition Done → CORRECTION_DONE (correction completed)
- Appealed → APPEALED (request appealed)
- Archived → COMPLETED + FAILED tasks
- Hidden: PENDING_INFO, WAITING_CORRECTION (shown separately)
```

### Functional Requirements

**FR1: View Section Tasks (Kanban Board)**
- Employee/Manager opens Task Board page
- System retrieves tasks where sectionId matches employee's section
- System organizes tasks into Kanban columns (see mapping above)
- Each task card displays:
  - Task ID
  - Service name
  - Citizen name
  - Current status
  - Priority (if applicable)
  - Estimated time remaining
  - Assigned employee name (if assigned)
- Board is real-time updated
- Tasks with PENDING_INFO and WAITING_CORRECTION hidden from board (but accessible via filter)

**FR2: View Request and Task Details**
- Employee clicks "Details" on task card
- System displays full task information:
  - Task ID, name, status
  - Service request details (ID, citizen name, service name)
  - Complete workflow timeline (all tasks in sequence, with current highlighted)
  - Assigned employee and assignment date
  - Citizen-uploaded documents (download option)
  - Internal task documents (uploaded by previous employees)
  - Result/output documents (uploaded by current employee)
  - Complete task history/activity log
  - Available actions (buttons for next steps based on status)

**FR3: Assign Task to Self**
- Employee views unassigned task (status: BACKLOG)
- Employee clicks "Assign to Me"
- System assigns task to current employee
- System sets task status to IN_PROGRESS
- Task moved to "In Progress" column
- Assignment recorded in task history with timestamp
- Previous employee (if task returned) receives notification "Your correction was accepted"

**FR4: Unassign Task from Self**
- Employee can unassign themselves from a task they're working on
- Employee clicks "Unassign from Me"
- System clears assigned employee
- System sets task status back to ASSIGNED (or BACKLOG)
- Task moved back to appropriate column
- Unassignment recorded in history
- Team lead/section manager notified

**FR5: Request Additional Documents**
- Task is in progress
- Employee determines citizen needs to provide more information
- Employee clicks "Request Additional Documents"
- Employee specifies: what information/documents needed, optional instructions
- System sets task status to PENDING_INFO
- System updates parent request status to PENDING_INFO
- System creates notification for citizen
- Citizen can respond via Module 5 (FR8)
- Task hidden from Kanban board (awaiting citizen response)

**FR6: Upload Task Documents**
- Employee uploads internal documents (work notes, analysis, etc.) or result documents
- System validates: file type, file size
- System stores document with category = INTERNAL or RESULT
- System links document to task
- Upload recorded in task history
- Document visible in task details

**FR7: Delete Task Document**
- Employee can delete documents they uploaded (result/internal documents)
- Employee clicks delete icon on document
- System removes document from storage and references
- Deletion recorded in task history

**FR8: Return Task to Previous Employee (Request Correction)**
- Current employee identifies issue with previous employee's work
- Employee clicks "Request Correction"
- Employee provides correction notes
- System sets current task status to WAITING_CORRECTION
- System sets previous task status to RETURNED_FOR_EDITION
- Previous employee receives notification: "Your task [X] returned for correction"
- Both task histories updated
- Current task hidden from Kanban board (awaiting previous employee correction)
- Previous employee can reassign task to themselves and fix work

**FR9: Approve Task (Complete Task)**
- Employee completes task work
- Employee uploads result documents (if applicable)
- Employee clicks "Approve" or "Complete Task"
- System validates: if documents required, at least one uploaded
- System sets task status to COMPLETED
- System records completion timestamp
- If this is final required task:
  - Request status updated to APPROVED
  - Citizen receives notification: "Your request approved"
  - Request workflow complete
- Else (more tasks remain):
  - Next task auto-assigned (or queued in BACKLOG)
  - Activity logged

**FR10: Reject Task**
- Employee determines task cannot be completed (citizen data invalid, impossible requirement)
- Employee clicks "Reject Task"
- Employee enters rejection reason (required)
- System sets task status to FAILED
- System sets request status to REJECTED
- System terminates all subsequent unstarted tasks in workflow
- Request status becomes REJECTED (citizen can now appeal)
- Citizen receives notification with rejection reason
- Activity logged

**FR11: Process Appeal**
- Request appealed by citizen (Module 5, FR12)
- Task status set to APPEALED
- Employee/Manager reviews appeal information and citizen notes
- Employee selects one of:
  - **Accept Appeal**: 
    - Task status → IN_PROGRESS
    - Request status → IN_PROGRESS
    - Task reassigned (if needed)
    - Activity logged
  - **Reject Appeal**:
    - Task status → FAILED
    - Request status → FINAL_REJECTION
    - Activity logged
- Citizen notified of decision

**FR12: View Tasks Organized by Priority and Type**
- Employee can view their assigned tasks
- System provides filter/sort options:
  - By priority (HIGH, MEDIUM, LOW)
  - By task type (category from service definition)
  - By status
  - By due date
- List view alternative to Kanban board

**FR13: Auto-Assign Tasks**
- When previous task completed, system automatically assigns next task
- System checks next task's responsible section
- System either:
  - Assigns to available employee in section, OR
  - Creates task in BACKLOG for section to claim
- Task status set to ASSIGNED (if assigned) or BACKLOG (if section-level)
- Assigned employee receives notification (if auto-assigned to them)

### Use Cases
- **UC-E01**: View Section Tasks (Kanban Board)
- **UC-E02**: View Request and Task Details
- **UC-E03**: Assign Task to Self
- **UC-E04**: Unassign Task from Self
- **UC-E05**: Request Additional Documents
- **UC-E06**: Upload Task Documents
- **UC-E07**: Delete Task Documents
- **UC-E08**: Return Task to Previous Employee
- **UC-E09**: Approve Task
- **UC-E10**: Reject Task
- **UC-E11**: Process Appeal

### Non-Functional Requirements
- **NFR 1.01**: Kanban board loads and updates within 3 seconds
- **NFR 1.02**: Support 1000+ concurrent users viewing tasks
- **NFR 7.01**: All task actions logged with actor, timestamp, action
- **NFR 7.02**: Complete audit trail of task transitions

### Dependencies
- **Depends On**: Module 1 (Auth), Module 3 (Org Structure), Module 5 (Service Requests)
- **Used By**: Module 7 (Notifications), Module 8 (Audit Logging)

### API Endpoints
```
GET    /tasks/board           - Get Kanban board for employee's section
GET    /tasks/{id}            - Get task details
GET    /tasks/{id}/history    - Get task activity history

PUT    /tasks/{id}/assign     - Assign task to self
PUT    /tasks/{id}/unassign   - Unassign from self
PUT    /tasks/{id}/request-info - Request additional documents
PUT    /tasks/{id}/approve    - Approve/complete task
PUT    /tasks/{id}/reject     - Reject task
PUT    /tasks/{id}/request-correction - Request correction from previous

POST   /tasks/{id}/documents  - Upload task document
DELETE /tasks/{id}/documents/{docId} - Delete document
GET    /tasks/{id}/documents  - Get task documents

PUT    /tasks/{id}/appeal/accept - Accept appeal
PUT    /tasks/{id}/appeal/reject - Reject appeal
```

---

## 📋 MODULE 7: UTILITY BILLING & PAYMENT MANAGEMENT

### Purpose
Enable citizens to view utility accounts and bills, pay bills, and track payment status. Support manual payment verification by admin/finance.

### Data Model

```
UtilityAccount Entity:
- accountId (PK)
- citizenId (FK)
- accountNumber (unique)
- accountType (enum: ELECTRICITY, WATER, GAS, SANITATION)
- address
- createdDate
- status (enum: ACTIVE, INACTIVE)

UtilityBill Entity:
- billId (PK)
- accountId (FK)
- billingPeriodStart (date)
- billingPeriodEnd (date)
- consumption (decimal) - units (kWh, m³, etc)
- consumptionUnit (enum: KWH, CUBIC_METER, UNIT)
- ratePerUnit (decimal)
- totalAmount (decimal)
- dueDate (date)
- billStatus (enum: UNPAID, PAID, OVERDUE, DISPUTED)
- paymentStatus (enum: NOT_PAID, PENDING_VERIFICATION, PAID, PAYMENT_FAILED)
- issuedDate
- createdAt

BillPayment Entity:
- paymentId (PK)
- billId (FK)
- citizenId (FK)
- amount (decimal)
- paymentMethod (enum: BANK_TRANSFER, ONLINE_PAYMENT, CASH)
- transferNumber (string) - bank transaction reference
- proofOfPaymentPath (file path)
- paymentDate
- verificationStatus (enum: PENDING_VERIFICATION, VERIFIED, REJECTED)
- verificationDate
- verifiedBy (userId)
- notes (text)
- createdAt
```

### Functional Requirements

**FR1: View Utility Accounts (Citizen)**
- Citizen opens "Utility Bills" page
- System displays all utility accounts for citizen:
  - Account number
  - Account type (Electricity, Water, Gas, etc)
  - Status (Active/Inactive)
  - Most recent bill amount and due date
- Citizen can click account to view full billing history

**FR2: View Utility Bills (Citizen)**
- Citizen opens utility account
- System displays all bills for account:
  - Billing period (from-to dates)
  - Consumption amount and unit
  - Amount due
  - Due date
  - Payment status (Unpaid/Paid/Overdue)
- Citizen can sort/filter by date, status
- Citizen can click bill to view detailed information

**FR3: View Detailed Bill Information (Citizen)**
- Citizen selects specific bill
- System displays:
  - Full billing period
  - Consumption (quantity and unit)
  - Unit rate
  - Calculated amount
  - Due date
  - Payment status
  - Payment history (if paid)
  - Late fees (if applicable)

**FR4: Pay Utility Bill (Citizen)**
- Citizen selects unpaid bill
- Citizen clicks "Pay Now"
- System displays bill amount and payment form
- Citizen enters:
  - Transfer number (bank reference)
  - Payment method (Bank Transfer, Online, Cash)
  - Proof of payment (receipt image/PDF)
- Citizen submits payment
- System creates BillPayment record
- paymentStatus set to PENDING_VERIFICATION
- billStatus remains UNPAID (until verified)
- Citizen notified: "Payment received, awaiting verification"

**FR5: Mark Payment Pending Verification (System)**
- When citizen submits bill payment with proof
- System automatically records paymentStatus as PENDING_VERIFICATION
- Admin/Finance department notified of pending verification
- Payment awaits manual review

**FR6: Verify Utility Bill Payment (Admin/Finance)**
- Admin opens "Payments - Pending Verification" page
- Admin views pending bill payments with:
  - Citizen name
  - Bill amount
  - Transfer number
  - Proof of payment (display)
  - Payment date
- Admin reviews and either:
  - **Approve**: Sets verificationStatus to VERIFIED
  - **Reject**: Sets verificationStatus to REJECTED, notifies citizen to resubmit

**FR7: Update Bill Status After Payment Verification (System)**
- When payment verification complete:
  - If VERIFIED: billStatus updated to PAID, billStatus no longer shows "Unpaid"
  - If REJECTED: billStatus stays UNPAID, citizen must retry payment
- Bill marked as PAID only after verified payment
- Update recorded with verification timestamp

**FR8: View Billing and Payment History (Citizen)**
- Citizen can view complete history of:
  - All past bills (with payment status)
  - All payments made (with verification status, dates)
  - Payment receipts (download)
  - Transaction references
- Sortable by date, amount, status

### Use Cases
- **UC-C10**: View Utility Bills
- **UC-C11**: Pay Utility Bill

### Non-Functional Requirements
- **NFR 1.01**: Bill payment processing within 3 seconds
- **NFR 7.01**: All bill payments and verifications logged
- **NFR 8.01**: Bill amount and payment status consistent

### Dependencies
- **Depends On**: Module 1 (Auth), Module 2 (Citizen Profile)
- **Used By**: Module 8 (Notifications)

### API Endpoints
```
GET    /citizen/utility-accounts - Get citizen's accounts
GET    /citizen/utility-bills    - Get all bills for accounts
GET    /citizen/utility-bills/{id} - Get bill details
POST   /citizen/utility-bills/{id}/pay - Submit bill payment
GET    /citizen/billing-history  - Get payment history

GET    /admin/utility-payments   - Admin: List pending payments
PUT    /admin/utility-payments/{id}/verify - Admin: Verify payment
PUT    /admin/utility-payments/{id}/reject - Admin: Reject payment
```

---

## 📋 MODULE 8: DAMAGE ASSESSMENT & COMPLAINTS MANAGEMENT

### Purpose
Enable citizens to report damage and submit complaints, and enable admin to manage and respond to these reports.

### Data Model

```
DamageAssessment Entity:
- assessmentId (PK)
- citizenId (FK)
- submissionDate
- location (string) - location of damage
- description (text)
- damageSeverity (enum: MINOR, MODERATE, SEVERE)
- status (enum: SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, RESOLVED)
- assignedDepartment (FK)
- createdAt
- updatedAt

DamageAssessmentDocument Entity:
- documentId (PK)
- assessmentId (FK)
- filePath
- fileType (image, PDF, etc)
- uploadedDate

Complaint Entity:
- complaintId (PK)
- citizenId (FK)
- submissionDate
- title (string)
- category (enum: SERVICE_QUALITY, EMPLOYEE_CONDUCT, BILLING, FACILITY, OTHER)
- priority (enum: LOW, MEDIUM, HIGH)
- location (string, optional)
- description (text)
- photoPath (file path, optional)
- status (enum: SUBMITTED, UNDER_REVIEW, RESOLVED, CLOSED)
- assignedDepartment (FK, nullable)
- resolution (text, nullable)
- resolvedDate (datetime, nullable)
- createdAt
- updatedAt

ComplaintResponse Entity:
- responseId (PK)
- complaintId (FK)
- respondedBy (FK) - userId
- responseMessage (text)
- responseDate
- createdAt
```

### Functional Requirements

**FR1: Submit Damage Assessment Report (Citizen)**
- Citizen opens "Damage Assessment" page
- Citizen fills form:
  - Location of damage (address or description)
  - Description of damage
  - Severity level (Minor, Moderate, Severe)
- Citizen uploads supporting images/files (multiple allowed)
- Citizen submits
- System validates: description filled, at least one image/file
- System creates DamageAssessment with status SUBMITTED
- System creates DamageAssessmentDocument records for each file
- Citizen receives confirmation with assessment ID
- Admin notified of new damage report
- Activity logged

**FR2: View Damage Assessment Reports (Admin)**
- Admin opens "Damage Assessments" page
- System displays all submitted assessments:
  - Assessment ID
  - Citizen name
  - Location
  - Severity level
  - Status
  - Submission date
- Admin can search and filter by location, severity, status
- Admin can click assessment to view details

**FR3: View Damage Assessment Detail (Admin)**
- Admin clicks on assessment
- System displays:
  - All submitted details
  - All attached images/documents (viewable/downloadable)
  - Current status
  - Assigned department (if any)
  - Notes/comments (if any)
  - Activity history

**FR4: Manage Damage Assessment (Admin)**
- Admin can:
  - Assign assessment to department
  - Update status (UNDER_REVIEW, APPROVED, REJECTED, RESOLVED)
  - Add notes/comments
  - Mark as resolved
- Citizen receives notification of status updates

**FR5: Submit Complaint (Citizen)**
- Citizen opens "Complaints" page
- Citizen clicks "Submit New Complaint"
- Citizen fills form:
  - Title
  - Category (Service Quality, Employee Conduct, Billing, Facility, Other)
  - Priority (Low, Medium, High) - optional, auto-set
  - Location (optional)
  - Description (detailed)
  - Photo (optional)
- Citizen submits
- System validates: title + description filled
- System creates Complaint with status SUBMITTED
- Citizen receives confirmation with complaint ID
- Admin notified
- Activity logged

**FR6: View Complaints (Citizen)**
- Citizen opens "My Complaints" page
- System displays all submitted complaints:
  - Complaint ID
  - Title
  - Category
  - Submission date
  - Current status (Submitted, Under Review, Resolved)
- If no complaints: display "No complaints found"
- Citizen can click complaint to view details

**FR7: View Complaint Detail (Citizen)**
- Citizen clicks on complaint
- System displays:
  - All submitted details
  - Current status
  - Timeline of updates
  - Admin responses (if any)
- Citizen can track complaint progress

**FR8: Return Complaint Results (Admin)**
- Admin opens "Complaints Management" page
- Admin views all complaints with statuses
- Admin can:
  - Update status (UNDER_REVIEW, RESOLVED, CLOSED)
  - Add response message to citizen
  - Assign to department
  - Set resolution details
- When status changed to RESOLVED:
  - System creates ComplaintResponse record
  - Citizen receives notification with resolution message
  - Response includes response details and department contact

### Use Cases
- **UC-C12**: View My Complaints
- **UC-C13**: Submit Complaint
- **UC-C14**: Submit Damage Assessment Report

### Non-Functional Requirements
- **NFR 4.01**: Complaint form intuitive, supports image uploads
- **NFR 7.01**: All complaint submissions and status changes logged
- **NFR 8.01**: Complaint data consistent across submissions

### Dependencies
- **Depends On**: Module 1 (Auth), Module 2 (Citizen Profile)
- **Used By**: Module 9 (Notifications)

### API Endpoints
```
GET    /complaints             - Get citizen's complaints
POST   /complaints             - Submit complaint
GET    /complaints/{id}        - Get complaint details

GET    /damage-assessments     - Get citizen's assessments
POST   /damage-assessments     - Submit damage assessment
GET    /damage-assessments/{id} - Get assessment details

GET    /admin/complaints       - Admin: List all complaints
PUT    /admin/complaints/{id}  - Admin: Update complaint
POST   /admin/complaints/{id}/respond - Admin: Add response

GET    /admin/damage-assessments - Admin: List all assessments
PUT    /admin/damage-assessments/{id} - Admin: Update assessment
```

---

## 📋 MODULE 9: NOTIFICATIONS & COMMUNICATION

### Purpose
Send real-time notifications to all user types about service requests, task assignments, payment status, and system events.

### Data Model

```
Notification Entity:
- notificationId (PK)
- recipientId (FK) - userId who receives
- notificationType (enum: SERVICE_REQUEST_SUBMITTED, SERVICE_REQUEST_APPROVED, SERVICE_REQUEST_REJECTED, PAYMENT_VERIFIED, PAYMENT_FAILED, TASK_ASSIGNED, TASK_APPROVED, TASK_REJECTED, REQUEST_INFO_NEEDED, COMPLAINT_RESOLVED, DAMAGE_RESOLVED, BILL_DUE, etc.)
- title (string)
- message (text)
- relatedEntityType (enum: SERVICE_REQUEST, TASK, COMPLAINT, DAMAGE_ASSESSMENT, PAYMENT, BILL)
- relatedEntityId (string)
- isRead (boolean, default false)
- actionUrl (link to relevant page)
- createdAt
- readAt (nullable)
- expiresAt (nullable)

NotificationPreference Entity:
- preferenceId (PK)
- userId (FK)
- notificationType
- enabled (boolean)
- deliveryMethod (enum: IN_APP, EMAIL, SMS, PUSH)
- createdAt
- updatedAt
```

### Functional Requirements

**FR1: View Notifications (All Users)**
- User opens "Notifications" page
- System displays all unread + recent read notifications
- Each notification shows:
  - Title
  - Message preview
  - Timestamp
  - Related entity link
- User can click notification to navigate to related resource
- User can mark notification as read
- User can clear/dismiss notification

**FR2: Notification Creation (System Events)**
System automatically sends notifications for:

**Citizen Notifications:**
- Service request submitted → confirmation
- Service request in progress → task started
- Service request pending information → documents needed
- Service request approved → completion notification
- Service request rejected → reason + appeal info
- Payment verified → bill/service paid
- Payment failed → retry instruction
- Complaint/Damage response → resolution details
- Utility bill due → reminder
- Task assignment (internal) - not sent to citizen

**Employee Notifications:**
- New task assigned → task details link
- Additional documents requested → document link
- Correction requested → task link
- Task approved by next step → confirmation
- Task rejected → reason explanation

**Manager Notifications:**
- Employee action taken (task completed, rejected)
- Department performance metrics
- Complaint assigned to department
- Damage assessment assigned

**Admin Notifications:**
- Payment awaiting verification → verification link
- System warnings/errors → system alert
- New citizen registration → verification link

**FR3: Mark Notification as Read**
- User clicks notification (auto-marked read)
- User can manually mark as read from notification list
- readAt timestamp recorded

**FR4: Notification Preferences (Future Enhancement)**
- User can configure notification preferences:
  - Which notification types to receive
  - Delivery method (In-App, Email, SMS, Push)
- System respects preferences when creating notifications

**FR5: Notification Expiry**
- Some notifications auto-expire after time period
- Old notifications archived (not deleted)
- User can view notification history

### Use Cases
- **UC-S04**: Notification

### Non-Functional Requirements
- **NFR 1.01**: Notifications delivered within 1 second of event
- **NFR 7.01**: All notification deliveries logged

### Dependencies
- **Depends On**: Module 1 (Auth), Module 5 (Service Requests), Module 6 (Tasks), Module 7 (Billing), Module 8 (Complaints)
- **Used By**: All modules

### API Endpoints
```
GET    /notifications          - Get user's notifications
PUT    /notifications/{id}/read - Mark as read
DELETE /notifications/{id}     - Delete notification
GET    /notifications/unread-count - Get unread count
PUT    /notifications/preferences - Update preferences
```

---

## 📋 MODULE 10: DEPARTMENT MANAGER DASHBOARD & ANALYTICS

### Purpose
Provide department managers with visibility into employee performance, task progress, and departmental metrics.

### Data Model

```
DepartmentMetrics Entity (computed/aggregated):
- metricsId (PK)
- departmentId (FK)
- periodStartDate
- periodEndDate
- totalRequestsProcessed (int)
- totalTasksCompleted (int)
- totalTasksRejected (int)
- averageCompletionTimeHours (decimal)
- tasksInProgress (int)
- tasksPendingInfo (int)
- employeeCount (int)
- employeeIdleCount (int)
- complianceRate (decimal) - % tasks approved first time
- computedAt

EmployeePerformance Entity (computed):
- performanceId (PK)
- employeeId (FK)
- departmentId (FK)
- periodStartDate
- periodEndDate
- tasksAssigned (int)
- tasksCompleted (int)
- tasksRejected (int)
- tasksCorrected (int)
- averageTaskTimeHours (decimal)
- approvalRate (decimal) - % of tasks approved without correction
- computedAt
```

### Functional Requirements

**FR1: Monitor Department Performance**
- Manager opens "Department Performance" page
- System displays dashboard with:
  - Total requests processed (period)
  - Total tasks completed/rejected
  - Average processing time
  - Current tasks in progress
  - Pending information requests
  - Task approval rate (compliance metric)
  - Visual charts/graphs

**FR2: View Employee Performance**
- Manager can drill down to employee level
- System displays per-employee metrics:
  - Tasks assigned/completed
  - Rejection rate
  - Average task time
  - Tasks requiring correction
  - Approval rate (quality metric)
- Visual trends over time

**FR3: Download Performance Report**
- Manager clicks "Download Report"
- Manager selects format (Spreadsheet/PDF)
- System generates report with:
  - Department summary metrics
  - Employee breakdown
  - Period dates
  - Charts and graphs
  - Export timestamps
- Report downloaded to manager's device
- Action logged

**FR4: Performance Filtering**
- Manager can filter metrics by:
  - Date range (week, month, quarter)
  - Employee
  - Section
  - Task type
- Charts update based on filters

### Use Cases
- **UC-M03**: Monitor Department Performance
- **UC-M03.1**: Download Performance Report

### Non-Functional Requirements
- **NFR 1.01**: Dashboard loads within 3 seconds
- **NFR 5.01**: Support many metrics computations efficiently
- **NFR 7.01**: Report generation logged

### Dependencies
- **Depends On**: Module 3 (Org Structure), Module 5 (Service Requests), Module 6 (Tasks)
- **Used By**: Admin oversight

### API Endpoints
```
GET    /dashboard/department   - Get department metrics
GET    /dashboard/employees    - Get employee metrics
GET    /dashboard/report       - Generate/download report
```

---

## 📋 MODULE 11: ADMIN OVERSIGHT & SYSTEM LOGGING

### Purpose
Provide administrators with complete system visibility, audit trails, and system health monitoring.

### Data Model

```
SystemLog Entity:
- logId (PK)
- timestamp
- actorId (FK) - userId performing action
- actorRole (enum: CITIZEN, EMPLOYEE, MANAGER, ADMIN)
- actionType (enum: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, APPROVE, REJECT, VERIFY, DOWNLOAD, etc.)
- entityType (enum: USER, SERVICE_REQUEST, TASK, PAYMENT, COMPLAINT, SERVICE, EMPLOYEE, etc.)
- entityId (string) - ID of affected entity
- details (JSON) - optional detailed information
- ipAddress
- userAgent
- status (enum: SUCCESS, FAILURE)
- errorMessage (nullable)
- createdAt

AuditTrail Entity (specialized for sensitive entities):
- auditId (PK)
- entityType (enum: SERVICE_REQUEST, PAYMENT, USER)
- entityId (string)
- changeType (enum: CREATED, MODIFIED, DELETED, STATUS_CHANGE)
- previousValue (JSON, nullable)
- newValue (JSON)
- changedBy (userId)
- changeReason (text, nullable)
- timestamp
- createdAt
```

### Functional Requirements

**FR1: View System Logs (Admin)**
- Admin opens "System Logs" page
- System displays log entries (paginated) with:
  - Timestamp
  - Actor name and role
  - Action type
  - Entity type and ID
  - Target resource
  - Status (Success/Failure)
  - Error message (if failed)
- Entries sortable and filterable

**FR2: Filter and Search Logs**
- Admin can filter by:
  - Date range
  - Actor (user)
  - Action type
  - Entity type
  - Status (Success/Failure)
  - Entity ID (search)
- Advanced search options

**FR3: View Audit Trail (Request/Payment Specific)**
- For critical entities (Service Requests, Payments, Users):
- System maintains detailed audit trail
- Shows all modifications with:
  - Old value → New value
  - Timestamp
  - Actor
  - Reason (if provided)
- Complete immutable history

**FR4: System Health Monitoring (Future)**
- Admin can view:
  - System uptime percentage (target 99.5%)
  - Performance metrics (response times)
  - Error rates
  - Database health
  - Active users count

**FR5: Data Export for Compliance**
- Admin can export logs in multiple formats:
  - CSV
  - JSON
  - Excel
- Exports include date range, filters applied
- File download to admin device
- Export action logged

### Use Cases
- **UC-A18**: View System Logs

### Non-Functional Requirements
- **NFR 7.01**: All critical actions logged
- **NFR 7.02**: Complete audit trail for sensitive entities
- **NFR 2.01**: Logs retained for compliance period (typically 3-7 years)
- **NFR 4.01**: Log viewer UI intuitive

### Dependencies
- **Depends On**: Module 1 (Auth)
- **Used By**: Compliance and security oversight

### API Endpoints
```
GET    /admin/logs             - Get system logs
GET    /admin/logs/filter      - Get logs with filters
GET    /admin/audit-trail/{entityType}/{id} - Get audit trail for entity
POST   /admin/logs/export      - Export logs
```

---

## 📋 MODULE 12: PAYMENT MANAGEMENT (INTEGRATED)

### Purpose
Unified payment handling for both service request fees and utility bills, including verification workflows.

### Data Model
*(Combines entities from Module 5 and Module 7)*

```
Payment Entity (unified):
- paymentId (PK)
- paymentType (enum: SERVICE_REQUEST_FEE, UTILITY_BILL)
- relatedEntityId (requestId OR billId)
- citizenId (FK)
- amount (decimal)
- paymentMethod (enum: BANK_TRANSFER, ONLINE_PAYMENT, CASH)
- transferNumber (string) - bank transaction reference
- proofOfPaymentPath (file path)
- paymentStatus (enum: PENDING_VERIFICATION, VERIFIED, REJECTED, FAILED)
- paymentDate
- verificationDate
- verifiedBy (userId, nullable)
- notes (text)
- createdAt
```

### Functional Requirements

**FR1: Record Payment**
- When citizen submits payment for service request or utility bill
- System creates Payment record
- Payment initially in PENDING_VERIFICATION state
- Citizen notified: "Payment received, awaiting verification"

**FR2: Verify Payment (Admin/Finance)**
- Admin/Finance team views pending payments
- Reviews:
  - Payment amount
  - Transfer number/reference
  - Proof of payment (receipt)
  - Payer details
- Either verifies or rejects payment
- If VERIFIED: linked entity updated (request/bill marked PAID)
- If REJECTED: citizen notified, must resubmit

**FR3: Send Payment Confirmation**
- After payment verified
- System automatically sends confirmation notification:
  - Payment amount
  - Reference number
  - Service/Bill paid
  - Date

**FR4: View Billing & Payment History (Citizen)**
- Citizen can view all payments made:
  - Service fees paid
  - Utility bills paid
  - Dates and amounts
  - Verification status
  - Receipts (download)

### Use Cases
- **UC-C05**: Pay Service Fee
- **UC-C11**: Pay Utility Bill
- *From Module 5 & 7*

### Non-Functional Requirements
- **NFR 1.01**: Payment recording within 3 seconds
- **NFR 3.02**: Payment data encrypted in transit and at rest
- **NFR 7.01**: All payments logged and audited
- **NFR 8.01**: Payment amounts and statuses consistent

### Dependencies
- **Depends On**: Module 1 (Auth), Module 5 (Service Requests), Module 7 (Utility Billing)
- **Used By**: Module 9 (Notifications)

### API Endpoints
```
POST   /payments               - Record payment
GET    /payments               - Get citizen's payment history
GET    /admin/payments/pending - Admin: List pending verifications
PUT    /admin/payments/{id}/verify - Admin: Verify payment
PUT    /admin/payments/{id}/reject - Admin: Reject payment
```

---

# 🔒 CROSS-CUTTING CONCERNS

## Authentication & Authorization (All Modules)
- JWT token-based authentication
- Role-based access control enforced globally
- Endpoints require valid token with proper role

## Data Encryption
- Sensitive fields encrypted: passwords, payment details, identity documents
- TLS/HTTPS for all data in transit
- AES-256 for data at rest (database-level encryption recommended)

## Audit Logging (All Modules)
- Every action logged to SystemLog
- Includes: actor, action, entity, timestamp, status
- Sensitive operations (approvals, rejections, deletions) logged to AuditTrail
- Logs immutable and retained per compliance

## Error Handling & Validation
- Input validation on all endpoints (type, length, format)
- File upload validation (type, size, scanning for malware)
- Status transition validation (prevent invalid state changes)
- Detailed error messages for debugging, generic for users

## Performance Targets (NFR 1.01 & 1.02)
- Response time ≤ 3 seconds under normal load
- Support 1000 concurrent users
- Real-time Kanban board updates
- Efficient database queries with indexing

## Scalability (NFR 5.01)
- 3-tier architecture: presentation, business logic, data
- Horizontal scaling of business logic servers
- Database replication and caching (Redis) for high-read operations
- Async task queues for long-running operations

## Maintainability (NFR 6.01 & 6.02)
- Modular, loosely-coupled architecture
- Service workflow configuration without code changes
- Admin UI for service/document/task management
- Well-documented APIs and code

---

# 📊 ENTITY RELATIONSHIP SUMMARY

```
User (base)
├── Citizen (personal info, accounts, requests)
├── Employee (departmental assignment)
├── Department Manager (manages employees/sections)
└── Admin (full system access)

Organization
├── Department
│   └── Section
│       └── Employee (assigned to section)

Service Catalog
├── MunicipalityService
├── RequiredDocument (per service)
└── ServiceWorkflowTask (per service)

Service Request Lifecycle
├── ServiceRequest (citizen creates)
│   ├── RequestTask (one per workflow task, in sequence)
│   │   └── [Task Assignment & Processing]
│   ├── RequestDocument (citizen + employee uploads)
│   ├── RequestPayment (if fee required)
│   └── RequestActivity (audit trail)

Utility Billing
├── UtilityAccount (citizen's account)
│   ├── UtilityBill (monthly billing)
│   │   └── BillPayment (payment verification)

Complaints & Damage
├── Complaint (citizen submits)
├── DamageAssessment (citizen submits)

Notifications
└── Notification (event-driven to all user types)

Audit & Compliance
├── SystemLog (all actions)
└── AuditTrail (sensitive entity changes)
```

---

# 🚀 DEVELOPMENT SEQUENCE RECOMMENDATION

1. **Module 1**: Authentication & User Management (foundation)
2. **Module 3**: Organizational Structure (required for employees/managers)
3. **Module 2**: Citizen Profile (dependent on auth)
4. **Module 4**: Services Catalog (independent, define services before requests)
5. **Module 5 & 6**: Service Requests + Tasks (core feature set)
6. **Module 7**: Utility Billing (independent, similar to payments)
7. **Module 8**: Complaints & Damage Assessments (independent)
8. **Module 9**: Notifications (integrate after core modules)
9. **Module 10**: Department Analytics (refine after metrics stabilize)
10. **Module 11**: System Logging (implement throughout, finalize at end)
11. **Module 12**: Payment Integration (refinement, may be integrated into 5 & 7)

---

# 📝 NOTES FOR CLAUDE CODE SESSIONS

When working with Claude Code on each module:

1. **Provide context**: Paste the relevant module section from this document
2. **Reference data model**: Include entity definitions and relationships
3. **Specify use cases**: Include all UC-* scenarios for the module
4. **Non-functional requirements**: Remind Claude of performance/security targets
5. **Dependencies**: List modules that must be completed first
6. **API endpoints**: Provide expected endpoint structure
7. **Validation rules**: Include specific business logic rules
8. **Status enums**: Provide all possible values for status fields

This structured breakdown allows you to work on one module at a time with complete context, without overwhelming Claude Code with the entire 100-page SRS.

---

**Last Updated**: May 19, 2026
**System**: Techno Ammar Municipality Service Management System
**Version**: 1.0

# Project Creation Feature Specification

## Table of Contents
1. Overview
2. Database Schema Design
3. Status & Priority Mapping
4. API Endpoints
5. DTO Definitions
6. Error Responses
7. Security Considerations
8. Business Logic Flow

---

## 1. Overview

This specification defines the backend implementation for the Project Creation feature, including database schema, API endpoints, and business logic. Key requirements:
- Store status/priority as numeric values
- Support many-to-many label relationships
- Support milestones management
- Support project members management

---

## 2. Database Schema Design

### 2.1 Projects Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Project unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Project name |
| `summary` | VARCHAR(500) | NULL | Short summary |
| `description` | TEXT | NULL | Detailed description (HTML supported) |
| `status` | INT | NOT NULL, DEFAULT 1 | Status: 1=backlog, 2=planned, 3=in_progress, 4=completed, 5=canceled |
| `priority` | INT | NOT NULL, DEFAULT 0 | Priority: 0=no_priority, 1=urgent, 2=high, 3=medium, 4=low |
| `leader_id` | BIGINT | FOREIGN KEY REFERENCES users(id) | Project leader/user ID |
| `start_date` | DATE | NULL | Start date |
| `end_date` | DATE | NULL | Target end date |
| `progress` | INT | NOT NULL, DEFAULT 0 | Progress percentage (0-100) |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

### 2.2 Milestones Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Milestone unique identifier |
| `project_id` | BIGINT | FOREIGN KEY REFERENCES projects(id), NOT NULL | Parent project ID |
| `name` | VARCHAR(255) | NOT NULL | Milestone name |
| `description` | TEXT | NULL | Milestone description |
| `due_date` | DATE | NULL | Due date |
| `completed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Completion status |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

### 2.3 Project Members Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `project_id` | BIGINT | FOREIGN KEY REFERENCES projects(id), PRIMARY KEY | Project ID |
| `user_id` | BIGINT | FOREIGN KEY REFERENCES users(id), PRIMARY KEY | User ID |
| `role` | VARCHAR(50) | NULL | Member role in project |
| `joined_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Join timestamp |

### 2.4 Label Definitions Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Label unique identifier |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Label name |
| `color` | VARCHAR(7) | NOT NULL, DEFAULT '#6b7280' | Label color (hex code) |
| `description` | VARCHAR(255) | NULL | Label description |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### 2.5 Project Label Assignments Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `project_id` | BIGINT | FOREIGN KEY REFERENCES projects(id), PRIMARY KEY | Project ID |
| `label_id` | BIGINT | FOREIGN KEY REFERENCES label_definitions(id), PRIMARY KEY | Label ID |
| `assigned_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Assignment timestamp |

### 2.6 Issue Label Assignments Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `issue_id` | BIGINT | FOREIGN KEY REFERENCES issues(id), PRIMARY KEY | Issue ID |
| `label_id` | BIGINT | FOREIGN KEY REFERENCES label_definitions(id), PRIMARY KEY | Label ID |
| `assigned_at` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Assignment timestamp |

---

## 3. Status & Priority Mapping

### 3.1 Status Mapping

| Numeric Value | String Key | UI Display |
|---------------|------------|------------|
| 1 | backlog | Backlog |
| 2 | planned | Planned |
| 3 | in_progress | In Progress |
| 4 | completed | Completed |
| 5 | canceled | Canceled |

### 3.2 Priority Mapping

| Numeric Value | String Key | UI Display |
|---------------|------------|------------|
| 0 | no_priority | No Priority |
| 1 | urgent | Urgent |
| 2 | high | High |
| 3 | medium | Medium |
| 4 | low | Low |

---

## 4. API Endpoints

### 4.1 Project Endpoints

| HTTP Method | Endpoint | Controller Method | Description |
|-------------|----------|-------------------|-------------|
| POST | `/api/projects` | `createProject()` | Create new project |
| GET | `/api/projects` | `getAllProjects()` | Get all projects (with filters) |
| GET | `/api/projects/{id}` | `getProjectById()` | Get project by ID |
| PUT | `/api/projects/{id}` | `updateProject()` | Update project |
| DELETE | `/api/projects/{id}` | `deleteProject()` | Delete project |
| POST | `/api/projects/{id}/members` | `addMember()` | Add member to project |
| DELETE | `/api/projects/{id}/members/{userId}` | `removeMember()` | Remove member from project |

### 4.2 Milestone Endpoints

| HTTP Method | Endpoint | Controller Method | Description |
|-------------|----------|-------------------|-------------|
| POST | `/api/projects/{projectId}/milestones` | `createMilestone()` | Create milestone |
| GET | `/api/projects/{projectId}/milestones` | `getMilestones()` | Get all milestones |
| GET | `/api/projects/{projectId}/milestones/{id}` | `getMilestoneById()` | Get milestone by ID |
| PUT | `/api/projects/{projectId}/milestones/{id}` | `updateMilestone()` | Update milestone |
| DELETE | `/api/projects/{projectId}/milestones/{id}` | `deleteMilestone()` | Delete milestone |
| PUT | `/api/projects/{projectId}/milestones/{id}/complete` | `completeMilestone()` | Mark milestone as complete |

### 4.3 Label Endpoints

| HTTP Method | Endpoint | Controller Method | Description |
|-------------|----------|-------------------|-------------|
| POST | `/api/labels` | `createLabel()` | Create label definition |
| GET | `/api/labels` | `getAllLabels()` | Get all label definitions |
| PUT | `/api/labels/{id}` | `updateLabel()` | Update label definition |
| DELETE | `/api/labels/{id}` | `deleteLabel()` | Delete label definition |

### 4.4 Label Assignment Endpoints

| HTTP Method | Endpoint | Controller Method | Description |
|-------------|----------|-------------------|-------------|
| POST | `/api/projects/{projectId}/labels/{labelId}` | `assignLabelToProject()` | Assign label to project |
| DELETE | `/api/projects/{projectId}/labels/{labelId}` | `removeLabelFromProject()` | Remove label from project |
| POST | `/api/issues/{issueId}/labels/{labelId}` | `assignLabelToIssue()` | Assign label to issue |
| DELETE | `/api/issues/{issueId}/labels/{labelId}` | `removeLabelFromIssue()` | Remove label from issue |

---

## 5. DTO Definitions

### 5.1 CreateProjectRequest

```json
{
  "name": "string",                    // Required: Project name
  "summary": "string",                 // Optional: Short summary
  "description": "string",             // Optional: HTML description
  "status": "int",                     // Optional: Default 1 (backlog)
  "priority": "int",                   // Optional: Default 0 (no_priority)
  "leaderId": "long",                  // Required: Project leader ID
  "memberIds": ["long"],               // Optional: Array of member IDs
  "startDate": "string (YYYY-MM-DD)",  // Optional: Start date
  "endDate": "string (YYYY-MM-DD)",    // Optional: Target date
  "labels": [                          // Optional: Labels to assign
    {
      "id": "long"                     // Optional: Existing label ID
    }
  ],
  "milestones": [                      // Optional: Initial milestones
    {
      "name": "string",                // Required: Milestone name
      "description": "string",         // Optional
      "dueDate": "string (YYYY-MM-DD)" // Optional
    }
  ]
}
```

### 5.2 UpdateProjectRequest

```json
{
  "name": "string",                    // Optional
  "summary": "string",                 // Optional
  "description": "string",             // Optional
  "status": "int",                     // Optional
  "priority": "int",                   // Optional
  "leaderId": "long",                  // Optional
  "startDate": "string (YYYY-MM-DD)",  // Optional
  "endDate": "string (YYYY-MM-DD)",    // Optional
  "progress": "int"                    // Optional: 0-100
}
```

### 5.3 ProjectResponse

```json
{
  "id": "long",
  "name": "string",
  "summary": "string",
  "description": "string",
  "status": "int",
  "statusLabel": "string",
  "priority": "int",
  "priorityLabel": "string",
  "leaderId": "long",
  "leaderName": "string",
  "startDate": "string",
  "endDate": "string",
  "progress": "int",
  "memberCount": "int",
  "issueCount": "int",
  "openIssues": "int",
  "labels": [
    {
      "id": "long",
      "name": "string",
      "color": "string"
    }
  ],
  "milestones": [
    {
      "id": "long",
      "name": "string",
      "description": "string",
      "dueDate": "string",
      "completed": "boolean"
    }
  ],
  "createdAt": "string (ISO timestamp)",
  "updatedAt": "string (ISO timestamp)"
}
```

### 5.4 CreateMilestoneRequest

```json
{
  "name": "string",                    // Required: Milestone name
  "description": "string",             // Optional
  "dueDate": "string (YYYY-MM-DD)"     // Optional
}
```

### 5.5 CreateLabelRequest

```json
{
  "name": "string",                    // Required: Label name
  "color": "string",                   // Optional: Hex color (default '#6b7280')
  "description": "string"              // Optional: Label description
}
```

---

## 6. Error Responses

| HTTP Status | Error Type | Message |
|-------------|------------|---------|
| 400 | Validation Error | "Invalid request body" |
| 400 | Missing Field | "{field} is required" |
| 404 | Not Found | "Project not found" |
| 404 | Not Found | "Milestone not found" |
| 404 | Not Found | "Label not found" |
| 401 | Unauthorized | "Authentication required" |
| 403 | Forbidden | "Insufficient permissions" |
| 409 | Conflict | "Label name already exists" |
| 500 | Server Error | "Internal server error" |

---

## 7. Security Considerations

| Aspect | Implementation |
|--------|----------------|
| Authentication | JWT token required for all endpoints |
| Authorization | Only project leader/admin can modify project |
| Input Validation | Validate all fields (length, format, existence) |
| SQL Injection | Use prepared statements/JPA |
| XSS Protection | Sanitize HTML description |
| Rate Limiting | Implement rate limiting for create endpoints |
| Data Integrity | Use database transactions for multi-step operations |

---

## 8. Business Logic Flow

### 8.1 Project Creation Flow

1. **Validate Request**: Check required fields (name, leaderId)
2. **Create Project**: Save to `projects` table
3. **Add Members**: Insert records into `project_members` (if memberIds provided)
4. **Assign Labels**: Insert records into `project_label_assignments` (if labels provided)
5. **Create Milestones**: Insert records into `milestones` (if milestones provided)
6. **Return Response**: Return complete `ProjectResponse` with embedded labels and milestones

### 8.2 Milestone Completion Flow

1. **Update Milestone**: Set `completed = true`
2. **Update Project Progress**: Recalculate project progress based on completed milestones
3. **Save Changes**: Commit to database

### 8.3 Label Assignment Flow

1. **Validate**: Check if label and project exist
2. **Check Duplicate**: Ensure label is not already assigned
3. **Assign**: Insert into `project_label_assignments`
4. **Return Updated Project**: Return project with updated labels

---

## 9. Database Migration Script

Refer to: `backend/src/main/resources/db/migration/V3__create_projects_tables.sql`
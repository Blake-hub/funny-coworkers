# RBAC Requirement Specification

**Date**: 2026-05-22

---

## 1. Overview

This document defines the Role-Based Access Control (RBAC) requirements for the PMIS (Project Management Information System) application.

---

## 2. Role Definitions & Hierarchy

### 2.1 Role Hierarchy

```
ADMIN (highest)
    └── TEAM_OWNER
            └── TEAM_MEMBER (lowest)
```

### 2.2 Role Inheritance Rules

- `ADMIN` inherits all permissions from `TEAM_OWNER`
- `TEAM_OWNER` inherits all permissions from `TEAM_MEMBER`
- Higher roles automatically get all permissions of lower roles

### 2.3 Role Descriptions

| Role | Description |
|------|-------------|
| `ADMIN` | Default user with full access to organization-level operations |
| `TEAM_OWNER` | Manages their own team, invites members, CRUD team's projects/issues |
| `TEAM_MEMBER` | Creates issues, updates issues, reads projects, contributes to team |

---

## 3. Permission Definitions

### 3.1 Permission Structure

Permissions follow the `resource:action` format.

### 3.2 Full Permission Matrix

| Permission | ADMIN | TEAM_OWNER | TEAM_MEMBER | Notes |
|------------|-------|------------|-------------|-------|
| **Organization** | | | | |
| `organization:create` | ✅ | ❌ | ❌ | |
| `organization:read` | ✅ | ✅ | ✅ | |
| `organization:update` | ✅ | ❌ | ❌ | |
| `organization:delete` | ✅ | ❌ | ❌ | |
| **Team** | | | | |
| `team:create` | ✅ | ✅* | ❌ | *Team Owner can create teams |
| `team:read` | ✅ | ✅ | ✅ | Contextual for owners/members |
| `team:update` | ✅ | ✅ | ❌ | Only owner can update their team |
| `team:delete` | ✅ | ✅ | ❌ | Only owner can delete their team |
| `team:invite` | ✅ | ✅ | ❌ | Only owner can invite members |
| `team:remove_member` | ✅ | ✅ | ❌ | Only owner can remove members |
| `team:transfer_ownership` | ✅ | ✅ | ❌ | Only owner can transfer ownership |
| **Project** | | | | |
| `project:create` | ✅ | ✅ | ❌ | Only owner can create projects |
| `project:read` | ✅ | ✅ | ✅ | Contextual for team members |
| `project:update` | ✅ | ✅ | ❌ | Only owner can update projects |
| `project:delete` | ✅ | ✅ | ❌ | Only owner can delete projects |
| **Issue** | | | | |
| `issue:create` | ✅ | ✅ | ✅ | |
| `issue:read` | ✅ | ✅ | ✅ | Contextual for team members |
| `issue:update` | ✅ | ✅ | ✅ | All can update any issue |
| `issue:delete_own` | ✅ | ✅ | ✅ | Delete issues they created |
| `issue:delete_any` | ✅ | ✅ | ❌ | Owner can delete any issue in team |
| `issue:assign` | ✅ | ✅ | ✅ | |
| `issue:comment` | ✅ | ✅ | ✅ | |
| **User** | | | | |
| `user:read` | ✅ | ✅ | ✅ | View own profile + team members |
| `user:update_own` | ✅ | ✅ | ✅ | Update own profile |
| `user:update_any` | ✅ | ❌ | ❌ | Admin only |
| `user:delete` | ✅ | ❌ | ❌ | Admin only |
| **Audit** | | | | |
| `audit:read` | ✅ | ❌ | ❌ | Admin only |

### 3.3 Contextual Permission Rules

- `TEAM_OWNER` can only manage **their own team** and its projects/issues
- `TEAM_MEMBER` can only access **their team's** projects/issues
- `ADMIN` can access **all** teams, projects, and issues in the organization

---

## 4. Database Schema Changes

### 4.1 Team Entity Updates

Add `ownerId` to track team ownership:

```java
// Add to Team entity
@Column(name = "owner_id", nullable = false)
private Long ownerId;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "owner_id", insertable = false, updatable = false)
private User owner;
```

### 4.2 Project Entity Updates

Add `teamId` to associate projects with teams:

```java
// Add to Project entity
@Column(name = "team_id", nullable = false)
private Long teamId;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "team_id", insertable = false, updatable = false)
private Team team;
```

### 4.3 New Audit Log Entity

```java
@Entity
@Table(name = "audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "action", nullable = false, length = 100)
    private String action; // e.g., "ISSUE_CREATE", "TEAM_DELETE"

    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType; // e.g., "ISSUE", "TEAM", "PROJECT"

    @Column(name = "resource_id")
    private Long resourceId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details; // JSON or text

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
```

### 4.4 User Entity

**No changes needed** - already has `role` field.

---

## 5. Service Layer Design

### 5.1 Permission Service

Handles permission checks:

```java
@Service
public class PermissionService {
    // Check if user has a specific permission
    public boolean hasPermission(User user, Permission permission);

    // Check if user owns a specific team
    public boolean isTeamOwner(User user, Long teamId);

    // Check if user is a member of a specific team
    public boolean isTeamMember(User user, Long teamId);

    // Check if user is admin
    public boolean isAdmin(User user);
}
```

### 5.2 Permission Enum

```java
public enum Permission {
    ORGANIZATION_CREATE,
    ORGANIZATION_READ,
    ORGANIZATION_UPDATE,
    ORGANIZATION_DELETE,
    TEAM_CREATE,
    TEAM_READ,
    TEAM_UPDATE,
    TEAM_DELETE,
    TEAM_INVITE,
    TEAM_REMOVE_MEMBER,
    TEAM_TRANSFER_OWNERSHIP,
    PROJECT_CREATE,
    PROJECT_READ,
    PROJECT_UPDATE,
    PROJECT_DELETE,
    ISSUE_CREATE,
    ISSUE_READ,
    ISSUE_UPDATE,
    ISSUE_DELETE_OWN,
    ISSUE_DELETE_ANY,
    ISSUE_ASSIGN,
    ISSUE_COMMENT,
    USER_READ,
    USER_UPDATE_OWN,
    USER_UPDATE_ANY,
    USER_DELETE,
    AUDIT_READ
}
```

### 5.3 Role Enum

```java
public enum Role {
    ADMIN,
    TEAM_OWNER,
    TEAM_MEMBER
}
```

### 5.4 Permission Check Logic

- **Admin**: Always has all permissions
- **Team Owner**: Has permissions + contextual check (owns the resource)
- **Team Member**: Has permissions + contextual check (member of the resource's team)

---

## 6. Implementation Scope & Priority

### Phase 1: Core RBAC (Priority: High)

- [ ] Update Team entity with `ownerId`
- [ ] Update Project entity with `teamId`
- [ ] Create `Permission` enum
- [ ] Create `Role` enum
- [ ] Implement `PermissionService`
- [ ] Add permission checks in existing controllers/services
- [ ] Create default Admin user in database migration

### Phase 2: Team Ownership Features (Priority: Medium)

- [ ] Implement team ownership transfer
- [ ] Implement member removal
- [ ] Add contextual permission checks

### Phase 3: Audit Log (Priority: Medium)

- [ ] Create `AuditLog` entity
- [ ] Implement audit logging for critical actions
- [ ] Create audit log admin UI

### Phase 4: UI/UX Improvements (Priority: Low)

- [ ] Hide/show UI elements based on permissions
- [ ] Add team switcher for users in multiple teams
- [ ] Add role management UI for admins

---

## 7. Approach Summary

**Selected Approach: **Approach 1 - Simple Role-Based Permissions**

- Enum-based roles with permission checks in service layer
- Contextual permission checks (e.g., "is user the owner of this team?")
- Simple to implement, maintainable for small-to-medium apps
- Can evolve to more complex RBAC later if needed

---

## 8. Decision Log

| Decision | Reasoning |
|----------|-----------|
| Role hierarchy enabled | Easier to maintain than explicit permissions for each role |
| Contextual permissions | Better security and granular control |
| Team Owner only manages their team | Clear ownership boundaries |
| Audit log required | Security and compliance needs |

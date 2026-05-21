# Issue List Page Specification

## 1. Overview

The `/issues` page is a Kanban-style issue management interface that displays issues grouped by their status. It provides a compact table view similar to the `/projects` page, with drag-and-drop functionality to update issue statuses quickly.

## 2. Design Requirements

### 2.1 Layout
- Compact table component, no cell borders
- Similar visual style to the `/projects` page
- **Vertical grouping** of issues by status (each status group stacked vertically)

### 2.2 Status Groups
- Issues grouped by status, each group showing:
  - Status name + issue count (e.g., "In Progress (3)")
  - List of issues in that status
- Default order of groups:
  1. In Progress
  2. Todo
  3. Backlog
  4. Done
- Other statuses (Canceled, Duplicated) can be toggled or shown as additional groups

### 2.3 Default Issue Statuses (Configurable)
| ID | Name | Color | Order |
|----|------|-------|-------|
| 1 | Backlog | #808080 | 3 |
| 2 | Todo | #FFA500 | 2 |
| 3 | In Progress | #007BFF | 1 |
| 4 | Done | #28A745 | 4 |
| 5 | Canceled | #DC3545 | 5 |
| 6 | Duplicated | #6C757D | 6 |

## 3. Database Schema

### 3.1 Issue Table
```sql
CREATE TABLE issues (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status_id INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    assignee_id BIGINT REFERENCES users(id),
    reporter_id BIGINT REFERENCES users(id),
    priority_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Issue Status Definition Table
```sql
CREATE TABLE issue_status_definitions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Default Status Migration
```sql
INSERT INTO issue_status_definitions (name, color, display_order) VALUES
('Backlog', '#808080', 3),
('Todo', '#FFA500', 2),
('In Progress', '#007BFF', 1),
('Done', '#28A745', 4),
('Canceled', '#DC3545', 5),
('Duplicated', '#6C757D', 6);
```

## 4. API Endpoints

### 4.1 Issue Endpoints
- `GET /api/issues` - Get all issues (filtered by project, ordered by sort_order)
- `GET /api/issues/:id` - Get single issue
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue
- `PUT /api/issues/:id/status` - Update issue status (for drag and drop between statuses)
- `PUT /api/issues/:id/order` - Update issue sort order (for reordering within status)

### 4.2 Status Definition Endpoints
- `GET /api/issue-statuses` - Get all status definitions
- `POST /api/issue-statuses` - Create new status
- `PUT /api/issue-statuses/:id` - Update status
- `DELETE /api/issue-statuses/:id` - Delete status
- `PUT /api/issue-statuses/order` - Reorder statuses

## 5. User Interaction Flow

### 5.1 Viewing Issues
1. User navigates to `/issues`
2. Page loads all issues and groups them by status
3. Status groups displayed in default order
4. Each group shows count of issues in parentheses
5. Issues listed in compact table format within each group

### 5.2 Drag and Drop
1. User clicks and holds an issue card
2. Drags issue to another status group OR within the same group
3. Visual feedback shows:
   - **Same status (reordering)**: Insertion indicator (line above/below target issue)
   - **Different status**: Status group highlight AND insertion indicator on first/last issue in target group
4. On drop:
   - API call updates issue status and/or sort order
   - UI updates immediately (optimistic update)
   - Status counts refresh
   - Shows success toast notification

### 5.3 Customizing Statuses
1. User clicks "Manage Statuses" button
2. Modal opens with status management interface
3. User can:
   - Add new statuses
   - Edit existing status names/colors
   - Reorder status display
   - Toggle status visibility
4. Changes saved to database

## 6. UI Components

### 6.1 Main Container
- **Vertical scrollable container** for status groups (stacked vertically)
- Each group is a card with header and issue list
- Responsive: maintains vertical layout on all screen sizes

### 6.2 Status Group Component
```
┌─────────────────────────────────────────────┐
│ In Progress (2)                              │
├─────────────────────────────────────────────┤
│ Issue 1 Title                                │
│ Issue 2 Title                                │
└─────────────────────────────────────────────┘
```
- Header: Status name + issue count
- Body: List of issues in compact format
- Drop zone indicator when dragging over
- Insertion indicator when dragging within same group

### 6.3 Issue Card Component
- Compact, borderless table row style
- Shows:
  - Issue title
  - Priority indicator (color dot)
  - Assignee avatar/name
  - Due date (if set)
- Drag handle indicator
- Hover effects
- Insertion indicator (line above/below) when dragging over

### 6.4 Status Management Modal
- List of statuses with drag handles for reordering
- Color picker for each status
- Add/Edit/Delete buttons
- Save/Cancel actions

## 7. Drag and Drop Implementation

### 7.1 Technology
- Use `@atlaskit/pragmatic-drag-and-drop` for drag-and-drop
- Implement using Atlassian's pragmatic approach with hooks
- Supports smooth drag interactions and visual feedback
- Lightweight and performant with good TypeScript support

### 7.2 Installation
```bash
npm install @atlaskit/pragmatic-drag-and-drop
npm install @atlaskit/pragmatic-drag-and-drop-react
npm install @atlaskit/pragmatic-drag-and-drop-hitbox
```

### 7.3 Core Components/Hooks
- `useDraggable()` - Hook to make an element draggable
- `useDroppable()` - Hook to make an element a drop target
- `Draggable` - Higher-order component for draggable elements
- `Droppable` - Higher-order component for drop zones
- `DragOverlay` - Component to render dragged item preview

### 7.4 Interaction States
1. **Idle**: Normal display, no drag in progress
2. **Dragging**: Issue becomes semi-transparent with shadow, cursor changes to grabbing, drag overlay shows
3. **Over (Same Status)**: Target issue shows insertion indicator (line above/below) for reordering within the same group
4. **Over (Different Status)**: Both status group highlight AND insertion indicator on first/last issue in target group
5. **Dropped**: Issue animates to new position, API called

### 7.5 Data Flow

#### 7.5.1 Draggable Hook (Issue Card)
```typescript
// On drag start (useDraggable hook)
useDraggable({
  element: issueRef,
  onDragStart: (event) => {
    // Capture source status, issue, and original sort order
    setDraggingIssue(issue);
    event.setData('application/json', {
      issueId: issue.id,
      currentStatusId: issue.statusId,
      currentSortOrder: issue.sortOrder,
      sourceIndex: issues.findIndex(i => i.id === issue.id)
    });
  },
});
```

#### 7.5.2 Droppable Hook (Issue Card - for reordering within same status)
```typescript
// On drag over another issue (for reordering within same status)
useDroppable({
  element: issueCardRef,
  onDragEnter: (event) => {
    // Only highlight if dropping within same status group
    const data = event.getData('application/json');
    if (data) {
      const { currentStatusId } = JSON.parse(data);
      if (currentStatusId === issue.statusId) {
        setHighlightedIssue(issue.id);
        setDropPosition('before'); // or 'after' based on position
      }
    }
  },
  onDragLeave: () => {
    setHighlightedIssue(null);
  },
  onDrop: async (event) => {
    // Get dropped issue data
    const data = event.getData('application/json');
    if (!data) return;

    const { issueId, currentStatusId, sourceIndex } = JSON.parse(data);
    const targetIssue = issues.find(i => i.id === issue.id);

    // Check if dropping within same status group (reorder)
    if (currentStatusId === issue.statusId && issueId !== issue.id) {
      // Calculate new sort order based on target position
      const targetIndex = issues.findIndex(i => i.id === issue.id);
      const newSortOrder = calculateNewSortOrder(issues, sourceIndex, targetIndex);

      // Optimistic update
      reorderIssuesOptimistically(issueId, newSortOrder);

      try {
        // API call to update sort order
        await updateIssueSortOrder(issueId, newSortOrder);
        showToast('Issue reordered');
      } catch (error) {
        // Rollback on error
        revertIssueOrder(issueId);
        showToast('Failed to reorder issue');
      }
    }

    // Clear states
    setDraggingIssue(null);
    setHighlightedIssue(null);
  },
});
```

#### 7.5.3 Droppable Hook (Status Group - for changing status)
```typescript
// On drag over status group (for changing status)
useDroppable({
  element: statusGroupRef,
  onDragEnter: (event) => {
    // Highlight drop zone
    setHighlightedStatus(statusId);
    // Also show insertion indicator on first issue in the group
    if (issues.length > 0) {
      setHighlightedIssue(issues[0].id);
      setDropPosition('before');
    }
  },
  onDragLeave: (event) => {
    // Only remove highlight if leaving the status group entirely
    // (not when moving between issues within the group)
    if (!event.relatedTarget || !statusGroupRef.current.contains(event.relatedTarget)) {
      setHighlightedStatus(null);
      setHighlightedIssue(null);
    }
  },
  onDrop: async (event) => {
    // Get dropped issue data
    const data = event.getData('application/json');
    if (!data) return;

    const { issueId, currentStatusId } = JSON.parse(data);

    // Check if dropping on different status (change status)
    if (currentStatusId !== statusId) {
      // Calculate new sort order based on drop position
      let newSortOrder: number;
      if (dropPosition === 'before') {
        // Dropping at the top
        const firstIssue = issues[0];
        newSortOrder = firstIssue ? firstIssue.sortOrder - 1 : 0;
      } else {
        // Dropping at the bottom
        const lastIssue = issues[issues.length - 1];
        newSortOrder = lastIssue ? lastIssue.sortOrder + 1 : 0;
      }

      // Optimistic update
      updateIssueStatusOptimistically(issueId, statusId, newSortOrder);

      try {
        // API call to update status and sort order
        await updateIssueStatus(issueId, statusId, newSortOrder);
        showToast('Issue moved to ' + statusName);
      } catch (error) {
        // Rollback on error
        revertIssueStatus(issueId, currentStatusId);
        showToast('Failed to move issue');
      }
    }

    // Clear states
    setDraggingIssue(null);
    setHighlightedStatus(null);
    setHighlightedIssue(null);
  },
});
```

### 7.6 Drag Overlay
```typescript
// Render drag preview
{draggingIssue && (
  <DragOverlay>
    <div className="drag-preview">
      {draggingIssue.title}
    </div>
  </DragOverlay>
)}
```

### 7.7 Styling Considerations
- **Dragging element**: `opacity: 0.8`, `box-shadow: 0 10px 40px rgba(0,0,0,0.2)`
- **Drop zone highlight (status group)**: `border-color: #007BFF`, `background-color: rgba(0,123,255,0.1)`
- **Insertion indicator (reordering)**: `border-top: 3px solid #007BFF` or `border-bottom: 3px solid #007BFF` depending on drop position
- **Smooth transitions** for all state changes, including position changes during reordering

## 8. Data Models

### 8.1 Frontend Issue Interface
```typescript
interface Issue {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  statusId: number;
  sortOrder: number;
  assigneeId?: number;
  reporterId: number;
  priorityId?: number;
  createdAt: string;
  updatedAt: string;
}
```

### 8.2 Frontend Status Interface
```typescript
interface IssueStatus {
  id: number;
  name: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
}
```

## 9. Wireframe

```
┌─────────────────────────────────────────────────────────────────┐
│ Issues  [Manage Statuses]  [+ New Issue]                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ In Progress (3)                                         │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 1 Title           │ Priority │ Assignee │ Date     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 2 Title           │ Priority │ Assignee │ Date     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 3 Title           │ Priority │ Assignee │ Date     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Todo (5)                                                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 4 Title           │ Priority │ Assignee │ Date     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 5 Title           │ Priority │ Assignee │ Date     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 6 Title           │ Priority │ Assignee │ Date     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 7 Title           │ Priority │ Assignee │ Date     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Backlog (2)                                             │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 8 Title           │ Priority │ Assignee │ Date     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 9 Title           │ Priority │ Assignee │ Date     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Done (10)                                               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Issue 10 Title          │ Priority │ Assignee │ Date     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ...                                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 10. Additional Considerations

### 10.1 Performance
- Virtualize issue lists if many issues
- Infinite scroll or pagination
- Debounce API calls on drag

### 10.2 Accessibility
- Keyboard navigation for reordering
- Screen reader announcements
- High contrast mode support

### 10.3 Offline Support
- Optimistic updates
- Queue failed status changes
- Sync when reconnected

### 10.4 Analytics
- Track drag-and-drop events
- Time spent in each status
- Status transition patterns

## 11. Future Enhancements

1. Swimlanes by assignee or priority
2. Board customization (column widths, visibility)
3. Saved views/filters
4. Issue quick actions (edit, comment, assign)
5. Bulk status updates
6. Burndown chart integration

## 12. Dependencies

- `@atlaskit/pragmatic-drag-and-drop` - Drag and drop library
- `@atlaskit/pragmatic-drag-and-drop-react` - React bindings for drag and drop
- `@atlaskit/pragmatic-drag-and-drop-hitbox` - Hitbox utilities for drag and drop
- Color picker component
- Toast notification system
- Modal component
- Existing project/user API integration
# Project Detail Page Specification

## Table of Contents
1. Overview
2. Page Layout Design
3. Component Structure
4. API Endpoints Required
5. Data Flow
6. UI/UX Requirements
7. State Management

---

## 1. Overview

The Project Detail Page displays comprehensive information about a specific project. It provides users with an editable view of project information including milestones. The page features a responsive layout that integrates with the existing global sidebar navigation.

**Key Features:**
- Works with existing global sidebar (no new sidebar needed)
- Left panel with editable project information (name, summary, description, milestones)
- Right panel with collapsible cards for properties, progress, and updates
- All editable fields mirror the project creation page functionality

---

## 2. Page Layout Design

### 2.1 Layout Structure (Top-Down View)

```
┌────────┬───────────────────────────────────────────────────────────┐
│        │                      HEADER BAR                          │
│        │  [Back]  Project Name                              [Edit]│
│  SIDE  ├─────────────────────────────────┬─────────────────────────┤
│  BAR   │                                 │                         │
│ (64px) │         LEFT PANEL              │       RIGHT PANEL       │
│        │     (70%, Editable Content)     │   (30%, Collapsible)    │
│        │                                 │                         │
│        │  ┌─────────────────────────┐    │  ┌───────────────────┐  │
│        │  │  1. Project Name        │    │  │ [Card] Properties │  │
│        │  │     (Editable)          │    │  │  ○ Status         │  │
│        │  └─────────────────────────┘    │  │  ○ Priority       │  │
│        │                                 │  │  ○ Labels         │  │
│        │  ┌─────────────────────────┐    │  │  ○ Dates          │  │
│        │  │  2. Summary             │    │  └───────────────────┘  │
│        │  │     (Editable)          │    │                         │
│        │  └─────────────────────────┘    │  ┌───────────────────┐  │
│        │                                 │  │ [Card] Progress   │  │
│        │  ┌─────────────────────────┐    │  │  ○ Progress Bar   │  │
│        │  │  3. Description         │    │  │  ○ Completion %  │  │
│        │  │     (Editable Rich Text)│    │  └───────────────────┘  │
│        │  └─────────────────────────┘    │                         │
│        │                                 │  ┌───────────────────┐  │
│        │  ┌─────────────────────────┐    │  │ [Card] Updates    │  │
│        │  │  4. Milestones          │    │  │  ○ Update History│  │
│        │  │     (Editable List)     │    │  └───────────────────┘  │
│        │  └─────────────────────────┘    │                         │
└────────┴─────────────────────────────────┴─────────────────────────┘
```

### 2.2 Dimensions

| Element | Width | Behavior |
|---------|-------|----------|
| Global Sidebar | 64px (fixed) | Existing navigation, non-collapsible |
| Header Bar | calc(100% - 64px) | Fixed, non-scrollable |
| Left Panel | 70% of main content | Primary content area, scrollable |
| Right Panel | 30% of main content | Collapsible to 0% width |

### 2.3 Responsive Design

| Screen Size | Layout |
|-------------|--------|
| Desktop (>1024px) | Sidebar + Two-column layout (70/30 split) |
| Tablet (768-1024px) | Sidebar + Two-column, right panel collapsed by default |
| Mobile (<768px) | Sidebar collapses to icons + Single column, right panel sections moved below |

---

## 3. Component Structure

### 3.1 Page Layout Component

```
<PageLayout>
  <GlobalSidebar />           {/* Existing - do not recreate */}
  <MainContent>
    <HeaderBar />            {/* Fixed header with back arrow & edit */}
    <ContentArea>
      <LeftPanel />           {/* 70% width, editable content */}
      <RightPanelToggle />    {/* Collapse/expand button */}
      <RightPanel />          {/* 30% width, collapsible */}
    </ContentArea>
  </MainContent>
</PageLayout>
```

### 3.2 LeftPanel Component (Editable)

**Props:**
- `project`: ProjectResponse - Full project data
- `milestones`: MilestoneResponse[] - Project milestones

**Sub-components (All Editable):**
- `EditableProjectName` - Input field for project name
- `EditableSummary` - Textarea for project summary  
- `EditableDescription` - Rich text editor for description
- `EditableMilestonesList` - List of milestones with add/edit/delete

**Editing Behavior:**
- Click field → Switch to edit mode
- Save button → Persist changes via API
- Cancel button → Revert to original value
- Changes auto-save after brief delay (optional)

### 3.3 RightPanel Component

**Props:**
- `project`: ProjectResponse - Full project data
- `milestones`: MilestoneResponse[] - Project milestones
- `isCollapsed`: boolean - Panel collapse state

**Sub-components:**
- `PanelToggle` - Collapse/expand button
- `PropertiesCard` - Status, priority, labels, dates (read-only)
- `ProgressCard` - Visual progress indicator
- `UpdatesCard` - Update history/timeline

### 3.4 CollapsibleCard Component (Reusable)

**Props:**
- `title`: string - Card header title
- `defaultExpanded`: boolean - Initial expand state (default: true)
- `icon`: ReactNode - Optional icon for header

**Behavior:**
- Click header → Toggle expand/collapse
- Expand → Show full content
- Collapse → Show only header

---

## 4. API Endpoints Required

### 4.1 Project Details

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/{id}` | GET | Get complete project details |
| `/api/projects/{id}` | PUT | Update project information |

### 4.2 Milestones

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects/{projectId}/milestones` | GET | Get all milestones for project |
| `/api/projects/{projectId}/milestones` | POST | Create new milestone |
| `/api/projects/{projectId}/milestones/{id}` | PUT | Update milestone |
| `/api/projects/{projectId}/milestones/{id}` | DELETE | Delete milestone |
| `/api/projects/{projectId}/milestones/{id}/complete` | PUT | Mark milestone as complete |

### 4.3 Labels

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/labels` | GET | Get all available labels |
| `/api/labels/{labelId}/projects/{projectId}` | POST | Assign label to project |
| `/api/labels/{labelId}/projects/{projectId}` | DELETE | Remove label from project |

---

## 5. Data Flow

### 5.1 Page Load Flow

1. **Initial Load**
   - Fetch project details from `/api/projects/{id}`
   - Fetch milestones from `/api/projects/{id}/milestones`
   - Fetch labels from `/api/labels`

2. **State Initialization**
   - Set `project` state with fetched data
   - Set `milestones` state
   - Set `isRightPanelCollapsed` based on screen size

3. **UI Render**
   - Render existing global sidebar
   - Render header with project name
   - Render left panel with editable fields
   - Render right panel with collapsible cards

### 5.2 Editing Flow

**Editing Project Fields:**
1. Click editable field → Switch to edit mode
2. Modify content → Save changes → PUT `/api/projects/{id}`
3. Update local state → Refresh UI

**Adding Milestone:**
1. Click "Add Milestone" → Show milestone form
2. Fill form → Submit → POST `/api/projects/{id}/milestones`
3. Update local milestones → Refresh UI

**Editing Milestone:**
1. Click milestone → Switch to edit mode
2. Modify content → Save → PUT `/api/projects/{id}/milestones/{id}`
3. Update local state → Refresh UI

**Deleting Milestone:**
1. Click delete button → Confirmation → DELETE `/api/projects/{id}/milestones/{id}`
2. Remove from local milestones → Refresh UI

---

## 6. UI/UX Requirements

### 6.1 Left Panel - Editable Fields

**6.1.1 Project Name**
- Large font, bold
- Click to edit (input field)
- Save/Cancel buttons appear on focus
- Validation: Required field

**6.1.2 Summary**
- Medium font, gray color
- Click to edit (textarea)
- Character limit: 500
- Save/Cancel buttons appear on focus

**6.1.3 Description**
- Rich text editor (same as creation page)
- Click to edit
- Toolbar with formatting options
- Save/Cancel buttons

**6.1.4 Milestones**
- List of milestones with name and due date
- Add milestone button
- Edit icon per milestone
- Delete icon per milestone
- Checkbox to mark complete

### 6.2 Right Panel Cards

**6.2.1 Properties Card**
- Status badge (colored)
- Priority indicator
- Labels (color-coded chips)
- Start/Target dates with calendar icons

**6.2.2 Progress Card**
- Animated progress bar
- Percentage display
- "X of Y milestones completed"

**6.2.3 Updates Card**
- Update list with timestamp and user action
- Empty state: "No updates yet"

### 6.3 Animations

- **Panel Collapse/Expand**: Smooth width transition (300ms)
- **Card Expand/Collapse**: Smooth height transition (200ms)
- **Edit Mode Transition**: Smooth fade-in of input fields
- **Save Confirmation**: Brief highlight on save

---

## 7. State Management

### 7.1 Page State

```typescript
interface ProjectDetailState {
  project: ProjectResponse | null;
  milestones: MilestoneResponse[];
  isLoading: boolean;
  isRightPanelCollapsed: boolean;
  cardExpandedStates: {
    properties: boolean;
    progress: boolean;
    updates: boolean;
  };
  editingField: string | null; // e.g., 'name', 'summary', 'description'
}
```

### 7.2 Default State Values

| State | Default Value |
|-------|--------------|
| `project` | `null` |
| `milestones` | `[]` |
| `isLoading` | `true` |
| `isRightPanelCollapsed` | `false` (desktop), `true` (mobile) |
| `cardExpandedStates` | All `true` |
| `editingField` | `null` |

### 7.3 State Updates

| Action | State Change |
|--------|-------------|
| Page Load Complete | `isLoading = false` |
| Toggle Right Panel | `isRightPanelCollapsed = !isRightPanelCollapsed` |
| Start Editing | `editingField = 'fieldName'` |
| Save Edit | `editingField = null`, Update `project` |
| Milestone Added | `milestones = [...milestones, newMilestone]` |
| Milestone Deleted | `milestones = milestones.filter(...)` |

---

## 8. Navigation

- **Page URL**: `/projects/{id}`
- **Back Navigation**: `/projects`
- **Breadcrumbs**: `Projects > [Project Name]`

---

## 9. Accessibility

- Keyboard navigation for all editable fields
- Screen reader support for edit mode transitions
- Clear focus indicators
- Minimum 4.5:1 color contrast ratio
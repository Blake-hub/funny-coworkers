# Wiki Document Save Feature - Design Specification

**Date:** 2026-06-24
**Status:** Approved

## Overview

Implement a full CRUD wiki document system with rich text editing, dual-format storage (JSON + HTML), draft/published workflow, and image upload support.

## Requirements Summary

- **Scope:** Full CRUD - create, read, update, delete wiki documents
- **Content Format:** Store both JSON (for editing) and HTML (for display)
- **Draft/Published Workflow:** Save as draft, publish when ready
- **Image Support:** Upload images to local filesystem, reference by URL
- **Folder Structure:** Public/Team/Private folders with access control (Phase 3)
- **Page Hierarchy:** Support nested/child pages (Phase 3)

## Three-Phase Implementation

### Phase 1: Basic CRUD + JSON/HTML Storage
Basic flat-page document management with dual storage format.

### Phase 2: Draft/Published Workflow
Add save draft and publish functionality.

### Phase 3: Folder Structure + Permissions
Add three-level folder organization and team-based access control.

---

## Phase 1: Basic CRUD + JSON/HTML Storage

### 1.1 Database Schema

**WikiPage table modifications:**

```sql
-- Rename existing content column to content_html
ALTER TABLE wiki_page RENAME COLUMN content TO content_html;

-- Add new columns to wiki_page table
ALTER TABLE wiki_page ADD COLUMN content_json TEXT;      -- Tiptap JSON for editing
ALTER TABLE wiki_page ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE wiki_page ADD COLUMN team_id BIGINT;
ALTER TABLE wiki_page ADD COLUMN created_by BIGINT;

ALTER TABLE wiki_page ADD CONSTRAINT fk_wiki_team
  FOREIGN KEY (team_id) REFERENCES team(id);
```

**WikiPage Entity fields:**
- `id` - Primary key
- `title` - Document title (max 200 chars)
- `contentHtml` - HTML for display
- `contentJson` - Tiptap JSON for editing
- `parentPageId` - For nested pages (Phase 3)
- `isPublished` - Draft/Published flag
- `teamId` - Team ownership (Phase 3)
- `createdBy` - Author user ID
- `lastModifiedBy` - Last editor user ID
- `lastModifiedAt` - Auto-updated timestamp

**Image storage:**
- Location: `/uploads/wiki-images/` on server filesystem
- URL pattern: `/api/wiki/images/{filename}`
- No database changes needed

### 1.2 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wiki/pages` | List all wiki pages |
| GET | `/api/wiki/pages/{id}` | Get single page (returns JSON for editing) |
| POST | `/api/wiki/pages` | Create new page |
| PUT | `/api/wiki/pages/{id}` | Update page (save draft) |
| DELETE | `/api/wiki/pages/{id}` | Delete page |
| POST | `/api/wiki/pages/{id}/publish` | Publish page |
| GET | `/api/wiki/pages/{id}/html` | Get HTML for display view |

**Image endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wiki/images/upload` | Upload image, returns URL |
| GET | `/api/wiki/images/{filename}` | Serve uploaded image |

### 1.3 Backend Components

**New/Modified files:**
- `entity/WikiPage.java` - Update with new fields
- `dto/WikiPageDTO.java` - New DTO for API requests/responses
- `repository/WikiPageRepository.java` - Already exists
- `service/WikiPageService.java` - New service
- `controller/WikiPageController.java` - New controller
- `controller/WikiImageController.java` - New image upload controller

### 1.4 Frontend Components

**New/Modified pages:**
- `pages/wiki.tsx` - Update to load real data from API
- `pages/wiki/new-document.tsx` - Add Save Draft button
- `pages/wiki/[id].tsx` - NEW: View published document (HTML display)
- `pages/wiki/[id]/edit.tsx` - NEW: Edit document (load JSON)

**New components:**
- `components/WikiPageCard.tsx` - Reusable wiki page list item

**API service additions:**
- `services/api.ts` - Add wikiApi with CRUD methods

---

## Phase 2: Draft/Published Workflow

### 2.1 Backend Changes

- On every save, store both `contentJson` and `contentHtml`
- `POST /api/wiki/pages/{id}/publish` sets `isPublished = true`
- `GET /api/wiki/pages/{id}/html` returns HTML for display (for published pages)
- `GET /api/wiki/pages/{id}` returns JSON for editing (both draft and published)

### 2.2 Frontend Changes

**New Document Page:**
- "Save Draft" button - saves with `isPublished: false`
- "Publish" button - saves with `isPublished: true`
- Show "Last saved" timestamp

**View Document Page:**
- Display HTML content (read-only)
- "Edit" button → redirect to edit page
- Show published date if applicable

**Edit Document Page:**
- Load document JSON from `GET /api/wiki/pages/{id}`
- "Save Draft" and "Publish" buttons
- "Back to View" link

---

## Phase 3: Folder Structure + Permissions

### 3.1 Database Schema

**New folder table:**

```sql
CREATE TABLE wiki_folder (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  parent_folder_id BIGINT REFERENCES wiki_folder(id),
  visibility VARCHAR(20) DEFAULT 'private',  -- 'public', 'team', 'private'
  team_id BIGINT REFERENCES team(id),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by BIGINT REFERENCES app_user(id)
);

-- Add folder reference to wiki_page
ALTER TABLE wiki_page ADD COLUMN folder_id BIGINT REFERENCES wiki_folder(id);
```

### 3.2 Access Control

**Three visibility levels:**
- `public` - All authenticated users can view and edit
- `team` - Only team members can view, team admins can edit
- `private` - Only the creator can view and edit

**Backend enforcement:**
- Filter pages in list endpoint based on user permissions
- Validate access in view/edit endpoints
- Team membership check for team-scoped pages

### 3.3 Frontend Changes

**Wiki List Page:**
- Add folder tree navigation sidebar
- Filter by visibility: All / My Pages / Team Pages / Public Pages
- Folder icons and expand/collapse

**New Document Page:**
- Folder selector dropdown
- Visibility selector (Public/Team/Private)

---

## Data Flow

### Save Draft Flow

```
User types in editor → onUpdate captures both HTML and JSON
    ↓
User clicks "Save Draft"
    ↓
Frontend sends: { title, contentHtml, contentJson, isPublished: false }
    ↓
Backend: Validate → Save to DB → Return saved page
    ↓
Frontend: Show success toast, update "Last saved" timestamp
```

### Publish Flow

```
User clicks "Publish"
    ↓
Frontend sends: { title, contentHtml, contentJson, isPublished: true }
    ↓
Backend: Validate → Save → Return saved page
    ↓
Frontend: Show success toast, redirect to view page
```

### View Document Flow

```
User clicks page in wiki list
    ↓
GET /api/wiki/pages/{id}/html
    ↓
Backend: Check if published → Return HTML content
    ↓
Frontend: Render HTML in view mode
```

### Image Upload Flow

```
User pastes/drops image in Tiptap editor
    ↓
Tiptap image extension intercepts, calls POST /api/wiki/images/upload
    ↓
Backend: Save to /uploads/wiki-images/ → Return URL
    ↓
Frontend: Insert image node with returned URL into document
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Network error | Show error toast with retry option |
| Validation error (empty title) | Inline field error message |
| Unauthorized access | Redirect to login page |
| Page not found | Show 404 page |
| Image upload failure | Show error toast, allow retry |
| Server error | Show generic error toast |

---

## Testing Strategy

### Unit Tests
- WikiPageService: CRUD operations
- WikiPageController: Endpoint validation
- Image upload: File validation, storage

### E2E Tests (Playwright)
- Create new document and save
- Edit existing document
- Publish document and view
- Upload image in document
- Delete document

---

## File Structure

```
backend/src/main/java/com/example/pmis/
├── controller/
│   ├── WikiPageController.java      (NEW)
│   └── WikiImageController.java     (NEW)
├── dto/
│   ├── WikiPageDTO.java             (NEW)
│   ├── CreateWikiPageRequest.java   (NEW)
│   └── UpdateWikiPageRequest.java   (NEW)
├── entity/
│   └── WikiPage.java                (MODIFY)
├── repository/
│   └── WikiPageRepository.java      (EXISTS - no changes)
└── service/
    └── WikiPageService.java         (NEW)

frontend/src/
├── pages/
│   ├── wiki/
│   │   ├── [id].tsx                 (NEW - view)
│   │   └── [id]/
│   │       └── edit.tsx             (NEW)
│   └── wiki.tsx                     (MODIFY)
├── components/
│   └── WikiPageCard.tsx             (NEW)
└── services/
    └── api.ts                       (MODIFY - add wikiApi)
```

---

## Migration

**V12__wiki_page_updates.sql:**
```sql
-- Rename content to content_html
ALTER TABLE wiki_page RENAME COLUMN content TO content_html;

-- Add new columns
ALTER TABLE wiki_page ADD COLUMN content_json TEXT;
ALTER TABLE wiki_page ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE wiki_page ADD COLUMN team_id BIGINT;
ALTER TABLE wiki_page ADD COLUMN created_by BIGINT;

-- Create uploads directory marker
CREATE TABLE IF NOT EXISTS wiki_images (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by BIGINT REFERENCES app_user(id)
);
```

---

## Out of Scope (Future)

- Document versioning/history
- Document comments
- Document sharing links
- Search within documents
- Document templates
- Collaborative editing
- Document export (PDF, DOCX)
- Cloud image storage

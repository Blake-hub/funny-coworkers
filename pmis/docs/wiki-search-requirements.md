# Wiki Document Search Enhancement

**Created**: 2026-08-12  
**Status**: Approved — Ready for Implementation

---

## 1. Requirements

### 1.1 Functional Requirements

| # | Description | Priority |
|---|-------------|----------|
| R1 | User can search wiki documents by **title** or **content** containing a phrase or sentence | Must |
| R2 | Search supports both **English** and **Chinese** (and all Unicode text) | Must |
| R3 | Search is triggered from the search textfield on the `/wiki` page | Must |
| R4 | Results are displayed in the existing wiki list on the `/wiki` page | Must |
| R5 | Clicking a search result navigates to the document view page | Must |
| R6 | When navigating from search results, the search term is **highlighted** in the document view page | Must |
| R7 | Results are **ranked**: title matches rank higher than content matches | Should |
| R8 | Search respects **visibility permissions** — private documents are only shown to authorized users | Must |
| R9 | Each search result shows a **snippet** (context around the match) | Should |

### 1.2 Non-Functional Requirements

| # | Description |
|---|-------------|
| N1 | Search should respond within 500ms for up to 50,000 documents |
| N2 | Search input should have 400ms debounce to avoid excessive API calls |
| N3 | UI should show a loading indicator while searching |
| N4 | No external search engine dependencies (e.g., Elasticsearch) |

---

## 2. Architecture Decision: Option B

### 2.1 Chosen Approach: `content_text` Column + `ILIKE`

Add a plaintext column to store stripped HTML content, updated on every save. Query using PostgreSQL `ILIKE`.

### 2.2 Why This Approach?

| Factor | Analysis |
|--------|----------|
| **Chinese support** | `ILIKE '%关键词%'` is the natural approach for Chinese. Chinese has no word boundaries, so substring matching is the correct paradigm. FTS tokenizers (`pg_jieba`) add complexity for marginal benefit. |
| **English support** | `ILIKE '%keyword%'` handles English well enough. Not ideal for stemming ("running" won't match "run"), but sufficient for a PMIS. |
| **Performance** | Pre-stripping HTML at save time means queries run on plaintext — no regex at query time. PostgreSQL scans 10K-50K rows in < 300ms. |
| **Simplicity** | One Flyway migration, one entity field, one service change. Zero external dependencies. |
| **Maintainability** | Content is consistent — `content_text` is always kept in sync with `content_html`. |
| **Upgrade path** | If performance becomes an issue later, we can add a GIN index on `tsvector` built from `content_text` without changing the API. |

### 2.3 Performance Analysis

| Documents | Content size/doc | Estimated scan time |
|-----------|-----------------|---------------------|
| 1,000 | ~1,500 chars | < 10ms |
| 10,000 | ~1,500 chars | < 50ms |
| 50,000 | ~1,500 chars | < 300ms |

**Upgrade options if needed (in order)**:
1. Add `pg_trgm` GIN index — makes ILIKE use index instead of scan → 10-100x faster
2. Limit results to top 20 — already in the plan, caps cost
3. Cache popular searches in Redis or in-memory

---

## 3. Technical Design

### 3.1 Database Changes

**New column** on `wiki_pages` table:

```sql
ALTER TABLE wiki_pages ADD COLUMN content_text text;
```

**Backfill existing data**:
```sql
UPDATE wiki_pages SET content_text = regexp_replace(
  regexp_replace(COALESCE(content_html, ''), '<[^>]+>', ' ', 'g'),
  '\s+', ' ', 'g'
);
```

### 3.2 Entity Changes

`WikiPage.java` gains a new field:
```java
@Column(name = "content_text", columnDefinition = "text")
private String contentText;
```

### 3.3 Backend API

**New endpoint**:
```
GET /api/wiki/pages/search?q={keyword}
```

**Response**:
```json
{
  "results": [
    {
      "id": 198,
      "title": "Project Management Guide",
      "snippet": "...the basics of project management methodology...",
      "matchField": "TITLE",
      "score": 3,
      "updatedAt": "2026-08-12T10:00:00"
    },
    {
      "id": 197,
      "title": "Development Standards",
      "snippet": "...project management office responsibilities...",
      "matchField": "CONTENT",
      "score": 1,
      "updatedAt": "2026-08-11T15:30:00"
    }
  ],
  "totalCount": 42
}
```

**Ranking logic**:
- Title match: score = 3
- Content match: score = 1
- Sort by score DESC, then `updated_at` DESC
- Limit to 20 results

**Visibility filtering** (pseudocode):
```sql
WHERE (
  (visibility = 'PUBLIC') OR
  (visibility = 'TEAM' AND team_id = currentUser.teamId) OR
  (created_by = currentUser.id)
)
AND (title ILIKE '%keyword%' OR content_text ILIKE '%keyword%')
```

### 3.4 Frontend — /wiki Page

**Search input**:
- 400ms debounce on input change
- Trim whitespace before querying
- Clear results when input is empty
- Show loading spinner during search

**Results display**:
- When search query is active, the existing wiki list shows search results instead of the full list
- Each result shows: title, snippet (highlighted), match field indicator ("Title" / "Content"), last updated
- Snippet shows up to 80 characters around the match location (prefix + suffix)

### 3.5 Frontend — Document View Page (/wiki/:id)

**Highlight flow**:
1. User clicks search result → navigates to `/wiki/:id?q=keyword`
2. View page reads `?q=` from URL
3. After content renders, `highlightSearchTerm(container, term)` runs:
   - Walks DOM text nodes
   - Finds all instances of the term (case-insensitive)
   - Wraps each match in `<mark>` with yellow background
   - Auto-scrolls to first match
4. Clears highlights on unmount or when `?q=` changes

**Highlight implementation** (pseudocode):
```
function highlightSearchTerm(container, term) {
  // Remove existing highlights
  container.querySelectorAll('mark.search-highlight').forEach(mark => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  if (!term) return;

  // Walk text nodes
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (regex.test(node.nodeValue)) {
      // Split and wrap matches in <mark>
      // ...
    }
  }

  // Scroll to first match
  const first = container.querySelector('mark.search-highlight');
  first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
```

**Visual styling**:
```css
mark.search-highlight {
  background-color: #FEF3C7;
  color: inherit;
  padding: 2px 0;
  border-radius: 2px;
  box-shadow: 0 0 0 1px #FCD34D;
  transition: background-color 0.2s ease;
}

mark.search-highlight:first-of-type {
  animation: highlightPulse 1.5s ease-out;
}

@keyframes highlightPulse {
  0%   { background-color: #FCD34D; }
  100% { background-color: #FEF3C7; }
}
```

### 3.6 Save Flow Changes

When a document is saved (create or update), the backend will automatically:
1. Strip HTML tags from `content_html` using `Jsoup` or regex
2. Collapse whitespace
3. Store the result in `content_text`

This happens transparently in the service layer.

---

## 4. Implementation Tasks

### Phase 1: Backend Foundation
- [ ] Flyway migration: add `content_text` column
- [ ] Backfill existing documents with stripped plaintext
- [ ] Update `WikiPage` entity with `contentText` field
- [ ] Create utility method to strip HTML → plaintext
- [ ] Update save logic to auto-populate `content_text`
- [ ] Create search repository method (visibility-filtered ILIKE query)
- [ ] Create search service with ranking logic
- [ ] Add `GET /api/wiki/pages/search?q=` endpoint
- [ ] Add search API to frontend `api.ts`

### Phase 2: Frontend Search UI
- [ ] Wire debounced search on `/wiki` page search input
- [ ] Show loading state during search
- [ ] Replace list with search results when query is active
- [ ] Display snippet + match field indicator per result
- [ ] Navigate to `/wiki/:id?q=keyword` on result click

### Phase 3: Highlight in View Page
- [ ] Detect `?q=` URL param on view page
- [ ] Implement `highlightSearchTerm()` utility
- [ ] Apply highlighting after content render
- [ ] Auto-scroll to first match
- [ ] Clear highlights on unmount
- [ ] Style the `<mark>` elements

### Phase 4: Testing
- [ ] Test English search (title and content)
- [ ] Test Chinese search (title and content)
- [ ] Test mixed English + Chinese search
- [ ] Test visibility filtering (private docs not shown)
- [ ] Test empty search returns all docs
- [ ] Test no results found state
- [ ] Test highlight navigation from search
- [ ] Test highlight clearing on navigate away

---

## 5. Out of Scope (Future Considerations)

| Feature | Reason |
|---------|--------|
| Full-text search with ranking (tsvector) | ILIKE sufficient for current scale |
| Semantic search / vector search | Complexity too high for PMIS |
| Search suggestions / autocomplete | Can add later if needed |
| Search across issue/project/wiki types | User explicitly scoped to wiki only |
| Search filters (folder, author, date) | Can add as enhancements later |
| Search history / recent searches | Nice-to-have, not required |
| Keyboard shortcut (Ctrl+K) | Can add later |
| `pg_trgm` GIN index | Can add when performance warrants it |

---

## 6. Files to Be Modified

| File | Change |
|------|--------|
| `backend/src/main/resources/db/migration/V{N}__add_content_text.sql` | New migration |
| `backend/src/main/java/com/example/pmis/entity/WikiPage.java` | Add `contentText` field |
| `backend/src/main/java/com/example/pmis/repository/WikiPageRepository.java` | Add search query method |
| `backend/src/main/java/com/example/pmis/service/WikiPageService.java` | Add stripHTML + search methods |
| `backend/src/main/java/com/example/pmis/controller/WikiPageController.java` | Add search endpoint |
| `frontend/src/services/api.ts` | Add `searchWikiPages` API call |
| `frontend/src/pages/wiki.tsx` | Wire search input + display results |
| `frontend/src/pages/wiki/[id].tsx` | Add search term highlighting |
| `frontend/src/lib/highlight.ts` | New utility file for highlight logic |

# Issue Creation Dialog - Test Cases

## Test Environment
- Frontend: http://localhost:3001 (or port in use)
- Backend: http://localhost:8088

## Test Case 1: Default Height is 300px
**Objective**: Verify dialog opens at exactly 300px height

**Steps**:
1. Navigate to `/issues` page
2. Click the '+' button at top right to open "Create Issue" dialog
3. Inspect the dialog element using browser DevTools

**Expected Result**:
- Dialog height should be exactly 300px when opened
- Dialog should have all four corners rounded

**Verification**:
```css
/* In DevTools, check computed styles */
height: 300px;
border-radius: 0.5rem; /* all four corners rounded */
```

---

## Test Case 2: Dialog Expands as Text is Typed (No Scroll Yet)
**Objective**: Verify dialog height increases when typing, but no scrollbar appears

**Steps**:
1. Open the Create Issue dialog
2. Type a moderate amount of text (5-10 lines) in the Issue title field
3. Type some text in the Description (RichTextEditor)

**Expected Result**:
- Dialog height increases as content grows
- Text editor expands downward
- Chips row and footer move down accordingly
- No vertical scrollbar appears on the text editor

---

## Test Case 3: Scroll Bar Appears on Text Editor at Max Height
**Objective**: Verify scrollbar only appears on text editor when dialog reaches max height

**Steps**:
1. Open the Create Issue dialog
2. Keep typing in the Description field until dialog reaches maximum height
3. Continue typing to fill more than the available space

**Expected Result**:
- When dialog reaches 80vh (max height), it stops expanding
- Text editor shows a vertical scrollbar to accommodate further content
- Chips row and footer remain visible at bottom
- Chips row and footer do NOT move down once max height is reached

**Verification**:
```css
/* Text editor container should have scrollbar */
overflow-y: auto;
max-height: (remaining space after header, title, chips, footer)

/* Dialog should stop at max height */
max-height: 80vh;
```

---

## Test Case 4: All Corners are Rounded
**Objective**: Verify all four corners are rounded

**Steps**:
1. Open the Create Issue dialog
2. Inspect the dialog element

**Expected Result**:
- `border-top-left-radius`: 0.5rem (8px)
- `border-top-right-radius`: 0.5rem (8px)
- `border-bottom-left-radius`: 0.5rem (8px)
- `border-bottom-right-radius`: 0.5rem (8px)

---

## Test Case 5: Scroll Bar Position
**Objective**: Verify scrollbar only affects text editor, not entire dialog

**Steps**:
1. Open the Create Issue dialog
2. Fill content until scrollbar appears
3. Scroll within the text editor

**Expected Result**:
- Scrolling only affects the description area
- Header, title input, chips row, and footer remain fixed and visible
- Scrollbar is visible only within the text editor bounds

---

## Manual Test Script

```
=== Issue Creation Dialog Test ===

Prerequisites:
- Backend server running on port 8088
- Frontend server running on port 3000/3001
- User logged in

Test 1: Default Height
[ ] Dialog opens at exactly 300px height
[ ] Bottom corners are sharp (not rounded)
[ ] Top corners are rounded

Test 2: Text Editor Expansion
[ ] Typing in description causes dialog to expand
[ ] Chips row moves down with content
[ ] Footer moves down with content
[ ] No scrollbar appears during normal typing

Test 3: Max Height & Scroll
[ ] Dialog stops expanding at 80vh viewport height
[ ] Scrollbar appears only in text editor when max height reached
[ ] Header, chips, footer remain visible and fixed

Test 4: Visual Verification
[ ] Corner radius: all four corners rounded
[ ] Height: starts at 300px, max at 80vh
[ ] Scroll: only on text editor at max capacity
```

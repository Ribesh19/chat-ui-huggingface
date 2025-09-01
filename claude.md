# Claude Development Log - Last Updated: 2025-09-01

## Recent Development: Classroom Study Feature with Math Support

### Session Summary (2025-09-01)
Successfully implemented a comprehensive classroom study feature with PDF viewing, math expression support, and Khan Academy-style math input using MathQuill. The system allows students to upload study materials, highlight text, discuss content with an AI study assistant, and input complex mathematical expressions with visual rendering.

### Core Features Implemented

#### 1. Classroom Study Page (`/classroom/study`)
- **Location**: `/Users/ribeshmaharjan/chat-ui/src/routes/classroom/study/+page.svelte`
- **Key Fixes Applied**:
  - Fixed SSR issues with PDF viewer by adding browser checks
  - Fixed conversation API parentId threading issues for proper message chaining
  - Removed unnecessary sidebar by updating layout configuration

#### 2. Document Viewer with LaTeX Support
- **Location**: `/Users/ribeshmaharjan/chat-ui/src/lib/components/classroom/DocumentViewer.svelte`
- **Features**:
  - Supports multiple formats: PDF, Markdown, HTML, Text
  - KaTeX math rendering for LaTeX expressions
  - Smart text selection that preserves original LaTeX syntax
  - Highlighting system for selected passages
  - Font size controls

#### 3. Khan Academy-Style Math Input System
- **Components Created**:
  - `MathQuillLoader.svelte` - Loads jQuery and MathQuill dependencies
  - `MathField.svelte` - MathQuill field wrapper for visual math editing
  - `MathKeypad.svelte` - GCSE-appropriate math keypad with two tabs
  - `MathKeypadIcons.svelte` - SVG icons for keypad buttons

#### 4. Enhanced Chat Input with Math Support
- **Location**: `/Users/ribeshmaharjan/chat-ui/src/lib/components/chat/ChatInput.svelte`
- **Features**:
  - Integrated math mode toggle (∑ button)
  - Automatic LaTeX wrapping ($...$ format)
  - Field clearing after submission
  - Auto-enable math mode when LaTeX is selected from documents

### Key Technical Solutions

#### LaTeX Selection and Preservation
```javascript
// Smart LaTeX recovery from rendered content
function recoverOriginalLatex(selectedText, range) {
  // Extract numbers from selection
  const selectedNumbers = selectedText.match(/\d+\.?\d*/g) || [];
  // Find matching LaTeX in original content
  const latexRegex = /\\\((.*?)\\\)|\\\[(.*?)\\\]|\$\$(.*?)\$\$|\$([^$]*)\$/g;
  // Match based on number patterns
  // Returns original LaTeX like \( \dfrac{21 \times 4.2}{2.3} \)
}
```

#### Math Mode Integration
```javascript
// Auto-enable math mode for LaTeX content
$effect(() => {
  if (selectedPdfText && isLatex) {
    // Convert \(...\) to $...$ format
    mathExpression = '$' + mathExpression.slice(2, -2) + '$';
    message = mathExpression;
    enableMathMode = true; // Auto-switch to MathQuill field
  }
});
```

#### Keypad Configuration for GCSE Students
```javascript
// Numbers Tab - Basic operations and fractions
const numberKeys = [
  { label: 'a/b', symbol: '\\frac{}{}', type: 'insert' },  // Fraction
  { label: 'a b/c', symbol: '{}\\frac{}{}', type: 'insert' }, // Mixed fraction
  { label: 'x²', symbol: '^2', type: 'insert' },
  { label: '√', symbol: '\\sqrt{}', type: 'insert' }
];

// Algebra Tab - Variables and functions
const functionKeys = [
  { label: 'x', symbol: 'x', type: 'insert' },
  { label: 'sin', symbol: '\\sin', type: 'insert' },
  { label: 'θ', symbol: '\\theta', type: 'insert' }
];
```

### Math Rendering Pipeline
1. **Selection**: User highlights `\( \dfrac{21 \times 4.2}{2.3} \)` in PDF
2. **Recovery**: System extracts original LaTeX syntax using number-based matching
3. **Conversion**: Converts to `$ \dfrac{21 \times 4.2}{2.3} $` format for compatibility
4. **Auto-Mode**: Automatically enables MathQuill field via `enableMathMode` prop
5. **Rendering**: Displays as beautiful math in both input and chat using KaTeX

### Files Modified/Created

#### New Components
- `/src/lib/components/math/MathQuillLoader.svelte`
- `/src/lib/components/math/MathField.svelte`
- `/src/lib/components/math/MathKeypad.svelte`
- `/src/lib/components/math/MathKeypadIcons.svelte`

#### Modified Components
- `/src/routes/classroom/study/+page.svelte`
- `/src/lib/components/classroom/DocumentViewer.svelte`
- `/src/lib/components/classroom/ClassroomChat.svelte`
- `/src/lib/components/chat/ChatInput.svelte`
- `/src/routes/+layout.svelte` (removed sidebar for study page)

### Current State
- ✅ PDF/Document viewing with text selection
- ✅ LaTeX math expression preservation
- ✅ Khan Academy-style math input with keypad
- ✅ Auto-switching to math mode for LaTeX content
- ✅ Math rendering in user and assistant messages
- ✅ GCSE-appropriate math symbols and functions
- ✅ Mixed fractions and algebraic expressions support

### Known Issues Resolved
- **SSR DOMMatrix errors** → Fixed with browser checks (`{#if browser}`)
- **Conversation API parentId errors** → Fixed with proper message threading via `lastMessageId`
- **LaTeX selection returning garbage** → Fixed with smart recovery algorithm matching numbers
- **Math not rendering in chat** → Fixed with proper $ wrapping for KaTeX
- **Keypad buttons submitting form** → Fixed with `type="button"` on all keypad buttons
- **Manual math mode activation** → Fixed with auto-enable via `enableMathMode` prop
- **Math button not visible** → Fixed by forcing visibility and using text symbol "∑"
- **Keypad wrong position** → Fixed positioning to appear above tools with proper z-index

### Testing Checklist
- [ ] Upload markdown file with LaTeX expressions
- [ ] Select math expression like `\( \dfrac{21 \times 4.2}{2.3} \)`
- [ ] Verify it appears as `$ \dfrac{21 \times 4.2}{2.3} $` in input
- [ ] Confirm math mode auto-enables (∑ button shows active)
- [ ] Check math renders properly in conversation (both user and assistant messages)
- [ ] Test keypad input for fractions, square roots, and variables
- [ ] Verify field clears after submission
- [ ] Test SSR by refreshing page - no DOMMatrix errors
- [ ] Test conversation threading - messages appear in correct order
- [ ] Verify sidebar is hidden on /classroom/study page

### Next Steps for Future Development
1. **Enhanced Math Features**:
   - Add support for drawing geometric shapes (coordinate plane, graphs)
   - Implement step-by-step solution display for complex problems
   - Add more advanced symbols for A-level students (limits, derivatives, integrals)

2. **Study Features**:
   - Add practice problem generation based on document content
   - Implement spaced repetition system for concept review
   - Add progress tracking per topic with visual analytics

3. **Document Features**:
   - Enhanced PDF annotation features (highlighting, notes)
   - Support for handwritten math recognition
   - Collaborative study sessions with shared documents

4. **AI Improvements**:
   - Context-aware question suggestions based on highlighted content
   - Personalized learning path recommendations
   - Integration with curriculum standards (GCSE, A-level mapping)

---

# Elite-Quiz Web — Backend Schema, API Integration, and Play Flows
# This information is for previously AI math tutoring and learning platform that we are trying to upgrade.
This document provides a practical, implementation‑level overview to help wire your new frontend to the legacy/test backend export and to reason about how the Redux API layer is consumed across Quiz Zone and Math Mania flows.

It’s organized as:
- Database schema review (from `mhjsabco_pwaiproddb.sql`)
- Backend integration and environment/config
- Frontend API surface (`src/utils/api.jsx`) + consumption (`src/store/actions/campaign.js`)
- End‑to‑end navigation for Quiz Play and Math Mania (with example URLs)


## Database Schema Overview

Source file: `mhjsabco_pwaiproddb.sql`

The export is a MySQL 8 schema with data for a learning/quiz application. At a high level, there are six functional groups:

1) Users, Auth, Profile, and Settings
- `tbl_users`: core user table (profile + coins/etc.)
- `tbl_users_statistics`: global stats per user
- `tbl_users_badges`: awarded badges per user
- `tbl_users_in_app`: in‑app purchases / premium
- `tbl_authenticate`: admin panel roles/permissions JSON
- `tbl_settings`, `tbl_web_settings`: global app/system settings, web landing assets etc.
- `tbl_languages`, `tbl_upload_languages`: i18n and imported language packs

2) Taxonomy and Curriculum
- `tbl_category`, `tbl_subcategory`: core subject taxonomy used across features
- `tbl_level`: difficulty/levels per context
- `tbl_curriculum`: links units, chapters, difficulty levels to taxonomy (used heavily by Math Mania and Tutor flows). Important columns include `category_id`, `subcategory_id`, `chapter`, `unitname`, `difficulty_level`, `curriculum_id` (PK or logical key depending on export), and related text.
- `tbl_book_teaching_content`, `tbl_book_user_progress`: textbook-like content and per‑user reading progress

3) Questions and Modes
- Generic:
  - `tbl_question`: standard MCQ (Quiz Zone)
  - `tbl_question_reports`: report/flag questions
  - `tbl_quiz_categories`: quiz featured categories ordering/visibility
- Mode‑specific:
  - `tbl_maths_question`, `tbl_maths_progress`: math questions per curriculum/level and per‑user attempt/correct tracking
  - `tbl_nonverbal_reasoning_questions`, `tbl_non_verbal_reasoning_progress`
  - `tbl_audio_question`
  - `tbl_fun_n_learn`, `tbl_fun_n_learn_question`
  - `tbl_guess_the_word`
  - `tbl_exam_module`, `tbl_exam_module_question`, `tbl_exam_module_result`
  - `tbl_assessment_questions`, `tbl_assessment_results`: bundled assessment flows by year/subject (11+/SATs etc.)

4) Live/Competitive Modes
- `tbl_contest`, `tbl_contest_question`, `tbl_contest_leaderboard`, `tbl_contest_prize`
- `tbl_rooms`, `tbl_battle_questions`, `tbl_battle_statistics`: 1v1/group battle rooms and persisted results

5) Gamification and Monetization
- `tbl_badges`: catalogue of badges (types, thresholds, rewards)
- Leaderboards: `tbl_leaderboard_daily`, `tbl_leaderboard_monthly`
- `tbl_coin_store`: coin economy configuration
- `tbl_payment_request`: manual payout or rewards redemption

6) Misc / Ops
- `tbl_notifications`: notification messages
- `tbl_slider`: homepage sliders/banners
- `tbl_tracker`: income/lose trackers (used in the app UI as “table tracker” pages)
- `tbl_month_week`: date helpers for reports
- `tbl_web_settings`: static asset URLs for the web app (icons shown on home tiles)
- `tbl_tutor_session_progress`: stores the Tutor flow stage, proficiency, and conversation history per user/curriculum

Key relational ideas used by the frontend
- Taxonomy drives discovery: `tbl_category` → `tbl_subcategory` → `tbl_curriculum` (chapters/units/difficulty).
- Mode tables are keyed either by `(category_id, subcategory_id)` or by `curriculum_id` (Math Mania uses `curriculum_id + level`).
- Progress tables mirror that key choice (e.g., `tbl_maths_progress`: `user_id`, `curriculum_id`, `level`, `question_id`, `is_attempted`, `is_correct`).
- Settings tables expose feature flags and assets consumed by the home dashboard and AllQuiz tiles (`quiz_zone_mode`, `maths_quiz_mode`, icon filenames, etc.).


## Backend Integration

The frontend calls the backend through a Redux middleware that standardizes requests and auth headers.

Where to configure
- Base URL: `src/store/middleware/api.js:14`
  - `baseURL: \
    \
    ${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_END_POINT}`
  - Set in your `.env`:
    - `NEXT_PUBLIC_BASE_URL=https://your.api.host/` (trailing slash optional)
    - `NEXT_PUBLIC_END_POINT=api/v1/` (or whatever your PHP backend expects)

Auth
- The middleware injects `Authorization: Bearer ${api_token}` if `authorizationHeader` is not explicitly set to `false`.
- Token source: `getState().User?.data?.api_token`

API lifecycle
- Dispatch `apiCallBegan({ url, method, data, ... })` → middleware logs/requests → dispatches `apiCallSuccess` or `apiCallFailed` and triggers optional `onSuccess/onError` callbacks.
- Toasts: default to enabled; can be disabled per call with `displayToast: false`.

Server routes
- The PHP backend typically routes by action name (e.g. `get_maths_questions`) and uses POST with JSON or form data.
- All action strings are centralized in `src/utils/api.jsx` and referenced by action creators in `src/store/actions/campaign.js`.


## Frontend API Surface: How to Call

Definitions
- `src/utils/api.jsx` declares all route names and returns request descriptors (method/url/data/auth flags).
- `src/store/actions/campaign.js` wraps those descriptors in Redux actions via `apiCallBegan` and wires UI callbacks.

Example: Getting Math Questions
- Definition: `getMathQuestionsApi(type, type_id, level = 1, curriculum_id)` in `src/utils/api.jsx:40`
- Usage wrapper: `getmathQuestionsApi({...})` in `src/store/actions/campaign.js`
- Component usage (Math Mania Play):
  - `src/pages/math-mania/math-mania-play/index.jsx` imports `getmathQuestionsApi` and calls it with:
    - `type`: `'category'` or `'subcategory'`
    - `type_id`: the category or subcategory id
    - `level`: selected difficulty
    - `curriculum_id`: required when playing a specific unit/level

Auth expectations by endpoint
- Most reads require auth; public reads set `authorizationHeader: false` in the api descriptor.
- Example public: `get_settings`, `get_web_settings` (check your backend policy).

Adding a new endpoint
1) Add a constant and descriptor in `src/utils/api.jsx`.
2) Create a wrapper in `src/store/actions/campaign.js` that dispatches `apiCallBegan`.
3) Call the wrapper from your component, pass `onSuccess/onError` to receive results.


## How APIs Are Consumed in Components

Patterns
- Components do not call `fetch` directly. They import an action wrapper from `src/store/actions/campaign.js` and pass callback props.
- Example: Getting categories for Math Mania:
  - `src/pages/math-mania/index.jsx` → `categoriesApi({ type: 5, onSuccess, onError })` → Redux middleware → backend `get_categories` (type=5 is maths).
- Example: Getting subcategories under a category slug:
  - `src/pages/math-mania/sub-categories/[subcategories]/index.jsx` → `subcategoriesApi({ category_id: slug })` → `get_subcategory_by_maincategory`.
- Example: Chapters/units for a subject:
  - `getchaptersbycategoryApi({ category_id, subcategory_id })` → populates chapters/units for Level page.
- Progress:
  - `setMathsProgressApi`/`getMathsProgressApi` read/write progress for `(user_id, curriculum_id, level [, question_id])` and reducers consume this to compute statistics.
- Tutor session:
  - `getTutorSessionProgressApiCall`/`updateTutorSessionProgressApiCall` persist structured conversation and stage to `tbl_tutor_session_progress`.

See also the middleware pipeline in:
- `src/store/middleware/api.js:1`
- `src/store/actions/apiActions.js:1`


## Quiz Play and Math Mania Flows

Entry points
- Quiz Play hub: `src/pages/quiz-play/index.jsx` → renders `src/components/AllQuiz/AllQuiz.jsx`
- Math Mania hub: `src/pages/math-mania/index.jsx`

Home tiles (AllQuiz)
- Defined in `AllQuiz.jsx`. Tile visibility controlled by `systemConfig` flags from `tbl_settings` via `GET_SYSTEM_CONFIGURATIONS` and web icons from `GET_WEB_SETTINGS`.
- Clicking a tile navigates to the respective feature route, optionally enforcing premium checks (coins, unlock).

Quiz flows
1) Quiz Zone (English/general quiz)
   - `/quiz-zone` → category selection → play pages (not in scope of this doc but structurally similar to Math Mania).

2) Daily Quiz
   - `/quiz-play/daily-quiz-dashboard` → pulls `get_daily_quiz` and shows review/result pages under the same folder.

3) True/False
   - `/quiz-play/true-and-false-play` → uses `get_questions_for_true_false`.

4) Non‑Verbal Reasoning
   - `/non-verbal-reasoning` (hub) → play/review/result under `src/pages/quiz-play/non-verbal-reasoning-play/*` with separate progress tables.

5) Fun & Learn, Guess the Word, Self Challenge, Contest, Battle
   - Similar pattern: hub → detail → play → result/review with their dedicated tables.

Math Mania: subject‑driven curriculum flow

1) Hub: `/math-mania`
- Calls `categoriesApi({ type: 5 })` (type 5 = maths). Tiles are categories.
- On select:
  - If category has subcategories (`no_of` != 0), navigate to subcategories.
  - Otherwise, go straight to play page with `category` id.

2) Subcategories: `/math-mania/sub-categories/[subcategories]`
- Route param `[subcategories]` is the category slug.
- Loads subcategories via `subcategoriesApi({ category_id: slug })`.
- On select: push to Level page with query composed of both ids.

   Example generated URL:
   - `/math-mania/level/1?subcategory=16&category=9&subcategory_id=16&category_id=9&isSubcategory=1&is_play=1`

3) Levels (Chapters/Units): `/math-mania/level/[level]`
- Reads `category` and `subcategory` from query.
- Calls `getchaptersbycategoryApi({ category_id, subcategory_id })`.
- For each chapter, lists `units` (each has a `curriculum_id`).
- Also calls `getUnitLevelsByCategory({ category, subcategory, question_type: 'maths' })` to fetch available difficulty levels per `curriculum_id`.
- Bulk progress fetch: `fetchBulkMathsProgress({ user_id, curriculumLevels: [{ curriculum_id, level }, ...] })` to compute attempted/correct aggregation and decorate UI.
- Start a unit at a chosen level → navigate to play:
   - `/math-mania/math-mania-play?category=9&subcategory=16&curriculum_id=353&level=1&unit=1&skill=0&is_play=1`

4) Play: `/math-mania/math-mania-play`
- Reads `category/subcategory/curriculum_id/level` from query.
- Calls `getmathQuestionsApi({ type: 'subcategory' | 'category', type_id, level, curriculum_id })`.
- Renders math questions with LaTeX support and MathQuill input in `src/components/Quiz/Mathmania/MathmaniaQuestions`.
- On each attempt, client may call `setMathsProgressApi` to mark `is_attempted`/`is_correct` per `question_id`.
- On completion, components can call `setMathsResultApi` with aggregated stats.

Other notable navigations
- Assessment: `/assessment/[year]/[subject]-play.jsx` → calls assessment APIs and saves `tbl_assessment_results`.
- Exam Module: `/exam-module` and nested play/result pages → `tbl_exam_module*` tables.


## Wiring to Your Backend

1) Set environment
- `.env` (or `.env.local`):
  - `NEXT_PUBLIC_BASE_URL=https://your-host/` (no endpoint suffix)
  - `NEXT_PUBLIC_END_POINT=api/` (appends to the base)
  - Ensure CORS is enabled server‑side for your domain.

2) Auth
- After login/signup, store `api_token` under `state.User.data.api_token`.
- The middleware automatically injects the header.

3) Language/i18n
- `getLanguage()` in `src/utils/api.jsx` reads `state.Languages.currentLanguage` and `Settings.systemConfig.language_mode` to decide whether to pass `language_id` to endpoints.
- Ensure your backend supports `language_id` filters when language mode is on.

4) Permissions/Feature Flags
- Many hubs respect flags from `tbl_settings` (e.g., `maths_quiz_mode`), retrieved via `GET_SYSTEM_CONFIGURATIONS`. Make sure your server returns accurate flags; otherwise tiles are removed client‑side.

5) Data shape expectations (critical for stable UI)
- `get_chapters_by_category` should return an array shaped like:
  ```json
  [
    {
      "subcategories": [
        {
          "chapters": [
            {
              "chapter": 1,
              "chaptername": "Fractions",
              "units": [
                {"curriculum_id": 353, "unitname": "Unit 1"},
                ...
              ]
            }
          ]
        }
      ]
    }
  ]
  ```
- `get_unit_levels_by_category` should return array of `{ curriculum_id, levels: [{ difficulty_level, label? }] }`.
- `get_maths_questions` should accept `(type, type_id, level, curriculum_id)` and return `{ questions: [...] }` with stable ids (used by progress APIs).

6) Progress contracts
- `set_maths_progress(user_id, curriculum_id, level, question_id, is_attempted, is_correct)`
- `get_maths_progress(user_id, curriculum_id[, level][, question_id])` returns list of records `{ question_id, is_attempted, is_correct }`.
- Similar for non‑verbal reasoning under their own endpoints.

7) Tutor session
- `get_tutor_session_progress(user_id, curriculum_id)` → stored `current_stage`, `proficiency_level`, `conversation_history` (JSON stringified).
- `update_tutor_session_progress(...)` to persist after each exchange.


## Quick Validation Checklist

- [ ] `NEXT_PUBLIC_BASE_URL` + `NEXT_PUBLIC_END_POINT` are correct.
- [ ] Server returns JSON with `error: false` and data in expected shapes (see above contracts).
- [ ] `api_token` is set in Redux after login.
- [ ] `GET_WEB_SETTINGS` returns the home tile icons referenced in AllQuiz.
- [ ] Category → Subcategory → Chapters/Units → Questions flows work:
  - `/math-mania` → `/math-mania/sub-categories/[cat-slug]` → `/math-mania/level/1?category=...&subcategory=...` → `/math-mania/math-mania-play?...`.
- [ ] Progress and results endpoints return 200 and persist correctly.


## Notes and Recommendations

- The legacy schema mixes MyISAM/InnoDB on some tables — ensure FK integrity in your backend code.
- Use consistent slug vs id across routes. Frontend passes `slug` in some calls (`get_subcategory_by_maincategory`); standardize to id when possible.
- If you add streaming/Tutor features, prefer storing minimal conversation state server‑side and use `tbl_tutor_session_progress` as the source of truth.
- Consider rate‑limiting endpoints used by bulk progress fetches (Level page preloads many units/levels).


---
If you want, I can add sample Postman collection (JSON) that mirrors `src/utils/api.jsx` so you can test endpoints quickly against your backend before pointing the app at it.


## Tutor‑Me Chat — Math Input UI, Keypad, and MathQuill Field

This section explains the math input system you see in Tutor‑Me chat, including the “Math Keys / Math Input” toggle, the on‑screen keypad, and the editable math field powered by MathQuill. It’s written so an AI coding agent (or engineer) can replicate the behavior exactly.

Key files
- Math input wrapper: `src/components/KhanStyleMathInput/index.jsx:249`
- On‑screen keypad (tabs + keys): `src/components/KhanStyleMathInput/MathKeypad.jsx:1`
- MathQuill field bridge: `src/components/KhanStyleMathInput/MathField.jsx:1`
- Loader for jQuery + MathQuill assets: `src/components/KhanStyleMathInput/MathQuillLoader.jsx:4`
- Chat bubble math renderer helpers: `src/components/MathChatBubble.jsx:74`

High‑level structure
1) The Tutor chat input renders a Khan‑style input component which supports two modes:
   - Text mode: a normal `<textarea>` for plain text
   - Math mode: a MathQuill field with an optional popover keypad and dedicated “Exit Math Mode” button
2) The “Math Keys / Math Input” control toggles math mode. When active, the keypad can insert symbols/LaTeX into the MathQuill field at the cursor position.
3) When you submit, the raw LaTeX from MathQuill is normalized (see helpers) and sent along with the rest of the message content. Downstream chat bubbles render the math correctly.

About the “sc‑…” classes
- Those class names in your HTML snippet (e.g., `sc-geoRQH`, `sc-kEsJEW`) are generated by styled‑components. They map to styled elements inside `KhanStyleMathInput` and `MathKeypad`. You don’t hard‑code them; they’re produced at build time from components like `InputWrapper`, `IconButton`, `KeypadContainer`, etc.

UI elements mapping to your snippet
- “New chat” button is outside math input; it’s just the chat shell. The math controls correspond to:
  - “Math Keys”/“Math Input” button: `IconButton` in `KhanStyleMathInput/index.jsx:347` (title toggles between “Math Keys” and “Exit Math Mode”). In Tutor‑Me, you’ll also see a separate “Math Input” label beside it (driven by surrounding chat layout).
  - “Read Out for Me” button: this is your TTS control that calls `openaiTTS` from `src/utils/openai.js`; it’s adjacent to, but not part of, the math component.
  - Keypad header tabs “123”, “x²”, “△”, “πx”: `MathKeypad.jsx` defines four tabs with different key sets (basic digits/operators, powers/roots, trig, symbols).
  - Grid of keys like 7/8/9/%/×/÷/…, fraction, parentheses, backspace, etc.: generated from `keypadTabs` in `MathKeypad.jsx` and rendered as `<KeyButton>`s in a 6‑column grid.
  - The editable math field `<span class="math-field mq-editable-field mq-math-mode">…` corresponds to the MathQuill instance created in `MathField.jsx`.

How it works (step‑by‑step)
1) Asset loading (one‑time)
   - `MathQuillLoader.jsx:4` injects jQuery and MathQuill assets at runtime:
     - CSS: `https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.css`
     - JS:  `https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.js`
   - When `window.MathQuill` is ready, child components can initialize.

2) Component modes
   - `KhanStyleMathInput/index.jsx:249` holds local state:
     - `mathMode` boolean toggles between `<StyledTextarea>` (text mode) and `<MathField>` (math mode).
     - `showKeypad` toggles the keypad popover.
     - `text` stores the current value; in math mode it’s the LaTeX from MathQuill.
   - Toggling math mode:
     - `toggleKeypad()` switches mathMode on, shows the keypad and focuses the MathQuill field.
     - `exitMathMode()` hides keypad and returns to the plain textarea, leaving `text` intact.

3) MathQuill field bridge
   - `MathField.jsx:54` initializes the MQ interface with `const MQ = window.MathQuill.getInterface(2)`.
   - It creates an MQ field via `MQ.MathField(containerRef.current, { handlers: { edit } })`.
   - On each edit, it calls `onChange(mqRef.current.latex())` so the parent `KhanStyleMathInput` can keep `text` in sync.
   - The parent stores a ref `mathFieldRef` that allows direct insertion via MQ commands.

4) Keypad → MathQuill insertion contract
   - `MathKeypad.jsx` exposes `onInsert({ type, symbol })` when a key is pressed.
   - `KhanStyleMathInput/index.jsx:401` routes those insertions to MQ:
     - Digits (`/^\d$/`): `mq.cmd(symbol)`
     - Decimal: `mq.write('.')`
     - Fraction: `mq.cmd('\\frac')`
     - Square root: `mq.cmd('\\sqrt')`
     - `x^2`: writes `x`, then `mq.cmd('^')`, then `2`
     - `x^n`: writes `x`, caret, placeholder `{□}`, and moves cursor left
     - Generic LaTeX starting with `\`: `mq.cmd(symbol)`
     - Plain punctuation/operators: `mq.write(symbol)`
     - Backspace: `mq.keystroke('Backspace')`
   - After every insertion, `mq.focus()` keeps the caret in place.

5) Styling and the DOM
   - The MathQuill DOM structure includes `.mq-editable-field`, `.mq-root-block`, `.mq-math-mode`, which you style via the surrounding container:
     - See `MathInputContainer` rules in `KhanStyleMathInput/index.jsx:54`:
       - `.mq-editable-field` gets padding, rounded corners, and focus background.
       - `.mq-math-mode` adds an explicit border to differentiate math input.

6) Normalizing LaTeX for display/sending
   - `prepareMathForDisplay()` in `KhanStyleMathInput/index.jsx:219` cleans MathQuill‑specific forms and ensures consistent LaTeX (e.g., `\frac{a}{b}`, `\sqrt{…}`), which the chat bubbles can render.
   - `containsLatex()` in the same file detects if user text contains math snippets; used to decide how to render messages.
   - `MathChatBubble.jsx` uses those helpers to display math within chat.

How to replicate in another input bar
1) Wrap your input area with `<MathQuillLoader>` so assets load once.
2) Drop `<KhanStyleMathInput value={...} onChange={...} placeholder="Ask your Tutor..." />` where the textarea should be.
3) When the user submits, take the `value` (LaTeX in math mode or plain text otherwise) and pass through `prepareMathForDisplay(value)` before sending.
4) Render responses/messages with a component that supports LaTeX (you already use KaTeX/remark/rehype in `/chatui` and `MathChatBubble` in Tutor‑Me).

Accessibility and focus
- The keypad’s Close button (`×`) maps to `onClose()`; the “Exit Math Mode” circular button at the top‑right of the math field calls `exitMathMode()`.
- The caret/focus are managed by MathQuill; after every insertion we call `mq.focus()`.

Relation to your HTML snippet
- Container with textarea and “Math Keys” button: `KhanStyleMathInput` generates this with `StyledTextarea` (text mode) and `IconButton` (toggle). The class names you pasted are the runtime styled‑components hashes.
- Keypad header with tabs `123 / x² / △ / πx`: defined statically in `MathKeypad.jsx` under `keypadTabs`.
- Grid of keypad buttons: `KeypadGrid` + `KeyButton` in `MathKeypad.jsx`.
- The MathQuill field DOM (e.g., `<span class="mq-editable-field mq-math-mode">…`) is created by `MQ.MathField`; your surrounding styles target `.mq-*` classes via `MathInputContainer`.

Hooking into Tutor‑Me chat page
- Tutor‑Me uses this component in multiple places; you can locate references with a search for `KhanStyleMathInput` in `src/pages/tutor-me/tutor-me-chat/index.jsx` (there are several usages in the backup file too).
- The “Toggle Math Mode” tooltip text is tied to the same toggle function described above.

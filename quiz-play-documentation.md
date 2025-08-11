# Elite Quiz - Quiz Play Page Documentation

## Overview
The `/quiz-play` page serves as the main hub for all quiz activities in the Elite Quiz platform. It provides access to various learning modules, practice sessions, and assessment tools designed for exam preparation (SATs, 11+, 12+, 13+). The page features a modern, card-based interface with AI-powered learning experiences.

---

## Main Quiz Play Page Structure

### Page Location
- **URL**: `/quiz-play`
- **Component**: `src/pages/quiz-play/index.jsx`
- **Main Component**: `src/components/AllQuiz/AllQuiz.jsx`

### Layout Structure
- **Header**: Breadcrumb navigation
- **Main Content**: Grid of quiz option cards
- **Footer**: Standard layout footer

---

## Quiz Options Grid

The main page displays 13 different quiz options in a responsive grid layout:

### 1. English (Quiz Zone)
- **Icon**: `quiz_zone_icon` from web settings
- **Name**: "English"
- **Description**: "Choose your personalized starting point for practice with AI-tailored options to suit your needs."
- **URL**: `/quiz-zone`
- **Features**: 
  - Personalized practice options
  - AI-tailored content
  - Subject-specific learning paths

### 2. Daily Challenge
- **Icon**: `daily_quiz_icon` from web settings
- **Name**: "Daily Challenge"
- **Description**: "Tackle a new AI-crafted quiz daily to strengthen your skills, with instant feedback to track progress."
- **URL**: `/quiz-play/daily-quiz-dashboard`
- **Features**:
  - Daily AI-generated quizzes
  - Instant feedback system
  - Progress tracking

### 3. Quick Knowledge Check
- **Icon**: `true_false_icon` from web settings
- **Name**: "Quick Knowledge Check"
- **Description**: "Test your knowledge with fast AI-generated true/false questions, perfect for quick revision sessions."
- **URL**: `/quiz-play/true-and-false-play`
- **Features**:
  - True/false format
  - Quick revision sessions
  - AI-generated questions

### 4. Non-Verbal Reasoning
- **Icon**: `nonverbal_reasoning_icon` from web settings
- **Name**: "Non-Verbal Reasoning"
- **Description**: "Master non-verbal reasoning with AI-adapted visual challenges, designed to boost your grammar school prep."
- **URL**: `/non-verbal-reasoning`
- **Features**:
  - Visual reasoning challenges
  - Grammar school preparation
  - AI-adapted difficulty

### 5. Comprehension Practice
- **Icon**: `fun_learn_icon` from web settings
- **Name**: "Its all comprehension"
- **Description**: "Build comprehension skills for English with supportive AI exercises, making learning accessible and effective."
- **URL**: `/fun-and-learn`
- **Features**:
  - English comprehension focus
  - Supportive AI exercises
  - Accessible learning approach

### 6. Vocabulary Building
- **Icon**: `guess_the_word_icon` from web settings
- **Name**: "Vocabularies"
- **Description**: "Enhance your vocabulary with AI-curated word challenges, tailored to improve your exam performance."
- **URL**: `/guess-the-word`
- **Features**:
  - Vocabulary enhancement
  - AI-curated challenges
  - Exam performance focus

### 7. Self-Assessment
- **Icon**: `self_challange_icon` from web settings
- **Name**: "Test Yourself"
- **Description**: "Set your own pace with AI-customized challenges, designed to build confidence at every step."
- **URL**: `/self-learning`
- **Features**:
  - Self-paced learning
  - AI-customized challenges
  - Confidence building

### 8. Peer Practice Hub
- **Icon**: `contest_play_icon` from web settings
- **Name**: "Peer Practice Hub"
- **Description**: "Practice alongside others with AI-generated quizzes, offering a collaborative learning experience."
- **URL**: `/contest-play`
- **Features**:
  - Collaborative learning
  - AI-generated quizzes
  - Peer interaction

### 9. One-to-One Prep
- **Icon**: `one_one_battle_icon` from web settings
- **Name**: "One-to-One Prep"
- **Description**: "Get personalized AI feedback on your practice, as if guided by a dedicated tutor."
- **URL**: `/random-battle`
- **Features**:
  - Personalized AI feedback
  - Dedicated tutor experience
  - Individual attention

### 10. Group Study
- **Icon**: `group_battle_icon` from web settings
- **Name**: "Group Study"
- **Description**: "Join friends for AI-tailored group practice, perfect for SATs revision or GCSE collaboration."
- **URL**: `/group-battle`
- **Features**:
  - Group practice sessions
  - AI-tailored content
  - SATs/GCSE preparation

### 11. Audio Questions
- **Icon**: `audio_question_icon` from web settings
- **Name**: "Audio Questions"
- **Description**: "Improve your listening skills with AI-delivered audio questions, ideal for on-the-go prep."
- **URL**: `/audio-questions`
- **Features**:
  - Audio-based learning
  - Listening skills development
  - Mobile-friendly format

### 12. Maths Zone
- **Icon**: `math_mania_icon` from web settings
- **Name**: "Maths Zone"
- **Description**: "Conquer Maths with AI-adapted problems, designed to strengthen your skills step by step."
- **URL**: `/math-mania`
- **Features**:
  - Mathematics focus
  - AI-adapted problems
  - Step-by-step learning

### 13. Exam Style Simulations
- **Icon**: `exam_icon` from web settings
- **Name**: "Exam Style Simulations"
- **Description**: "Prepare with AI-simulated exams, offering insights to enhance your performance."
- **URL**: `/exam-module`
- **Features**:
  - Exam simulation
  - Performance insights
  - Real exam preparation

---

## Access Control & Authentication

### Authentication Requirements
- **Login Required**: All quiz options require user authentication
- **Subscription Required**: Premium content requires active subscription
- **Redirect Logic**: 
  - Unauthenticated users → `/auth/login`
  - Non-subscribers → `/pricing`

### System Settings Integration
Each quiz option can be enabled/disabled via system configuration:
- `quiz_zone_mode`
- `daily_quiz_mode`
- `contest_mode`
- `true_false_mode`
- `nonverbal_reasoning_mode`
- `fun_and_learn_mode`
- `guess_the_word_mode`
- `self_challenge_mode`
- `battle_quiz_mode`
- `group_play_mode`
- `audio_questions_mode`
- `math_questions_mode`
- `exam_questions_mode`

---

## Detailed Section Analysis

---

## 1. Maths Zone (`/math-mania`)

### Main Page Structure
- **URL**: `/math-mania`
- **Component**: `src/pages/math-mania/index.jsx`
- **Layout**: Category selection interface

### Navigation Flow
1. **Category Selection** → `/math-mania`
2. **Subcategory Selection** → `/math-mania/sub-categories/[subcategories]`
3. **Level Selection** → `/math-mania/level/[level]`
4. **Quiz Play** → `/math-mania/math-mania-play`
5. **Results** → `/math-mania/result`
6. **Review Answers** → `/math-mania/review-answer`

### Category System
- **API Type**: `type: 5` (Mathematics)
- **Structure**: Categories → Subcategories → Chapters → Units → Questions
- **Progress Tracking**: Individual unit progress with 5 status levels:
  - `not_started`
  - `attempted`
  - `familiar`
  - `proficient`
  - `mastered`

### Level Page Features (`/math-mania/level/[level]`)
- **Progress Visualization**: Visual progress indicators for each unit
- **Difficulty Levels**: Multiple difficulty options per unit
- **Chapter Navigation**: Tabbed interface for different chapters
- **Statistics Display**: 
  - Total units completed
  - Units in progress
  - Chapter completion status
- **Unit Boxes**: 10 boxes per unit showing individual progress

### Quiz Play Features (`/math-mania/math-mania-play`)
- **Question Types**: Mathematics-specific questions
- **Timer**: 60-second default timer
- **API Integration**: `getmathQuestionsApi`
- **Parameters**:
  - `curriculum_id`: Specific curriculum unit
  - `level`: Difficulty level (1-5)
  - `subcategory`: Subject area
- **Error Handling**: Fallback questions and retry mechanisms

### Result System
- **Score Calculation**: Percentage-based scoring
- **Progress Update**: Automatic progress tracking
- **Review Options**: Detailed answer review
- **Navigation**: Play again, next level, or return options

---

## 2. English (Quiz Zone) (`/quiz-zone`)

### Main Page Structure
- **URL**: `/quiz-zone`
- **Component**: `src/pages/quiz-zone/index.jsx`
- **Layout**: Category-based navigation

### Navigation Flow
1. **Category Selection** → `/quiz-zone`
2. **Subcategory Selection** → `/quiz-zone/sub-categories/[subcategories]`
3. **Level Selection** → `/quiz-zone/level/[level]`
4. **Quiz Play** → `/quiz-zone/level/[level]/dashboard-play`
5. **Results** → `/quiz-zone/result`
6. **Review Answers** → `/quiz-zone/review-answer`

### Category System
- **API Type**: `type: 1` (English/General)
- **Structure**: Categories → Subcategories → Levels → Questions
- **Premium Content**: Some categories may require unlocking

### Level System (`/quiz-zone/level/[level]`)
- **Unlock Mechanism**: Progressive level unlocking
- **Level Display**: Visual level indicators
- **Category Integration**: Links to main category structure
- **Play Options**: Direct play from level selection

### Quiz Play Features (`/quiz-zone/level/[level]/dashboard-play`)
- **Question Types**: English comprehension, grammar, vocabulary
- **Timer**: Configurable via `quiz_zone_duration` setting
- **Bookmark Integration**: Question bookmarking functionality
- **API Integration**: `QuestionsApi`
- **Parameters**:
  - `category_id`: Main category
  - `subcategory_id`: Subcategory (optional)
  - `level`: Current level

### Result System
- **Level Progression**: Automatic level advancement
- **Score Tracking**: Detailed performance metrics
- **Review System**: Comprehensive answer review
- **Navigation Options**: 
  - Play again
  - Next level
  - Review answers
  - Return to main menu

---

## 3. Non-Verbal Reasoning (`/non-verbal-reasoning`)

### Main Page Structure
- **URL**: `/non-verbal-reasoning`
- **Component**: `src/pages/non-verbal-reasoning/index.jsx`
- **Layout**: Category selection interface

### Navigation Flow
1. **Category Selection** → `/non-verbal-reasoning`
2. **Subcategory Selection** → `/non-verbal-reasoning/sub-categories/[subcategories]`
3. **Level Selection** → `/non-verbal-reasoning/level/[level]`
4. **Quiz Play** → `/non-verbal-reasoning/non-verbal-reasoning-play`
5. **Results** → `/non-verbal-reasoning/non-verbal-reasoning-play/result`
6. **Review Answers** → `/non-verbal-reasoning/non-verbal-reasoning-play/review-answer`

### Category System
- **API Type**: `type: 5` (Same as Mathematics)
- **Structure**: Categories → Subcategories → Chapters → Units → Questions
- **Progress Tracking**: Reuses mathematics progress system

### Level Page Features (`/non-verbal-reasoning/level/[level]`)
- **Progress Visualization**: Similar to Maths Zone
- **Chapter Navigation**: Tabbed interface for different chapters
- **Unit Progress**: Individual unit tracking
- **Statistics**: Completion and progress metrics

### Quiz Play Features (`/non-verbal-reasoning/non-verbal-reasoning-play`)
- **Question Types**: Visual reasoning, pattern recognition
- **Timer**: Configurable via `nonverbal_quiz_in_seconds` setting
- **Fallback System**: Dummy questions for network issues
- **API Integration**: `nonVerbalReasoningQuestionsApi`
- **Error Handling**: Robust retry mechanism with fallback questions

### Special Features
- **Visual Elements**: SVG-based question components
- **Pattern Recognition**: Arrow patterns and visual sequences
- **Fallback Questions**: 5 dummy questions for offline/error scenarios
- **Retry Logic**: Up to 2 retry attempts with user feedback

---

## 4. Daily Challenge (`/quiz-play/daily-quiz-dashboard`)

### Page Structure
- **URL**: `/quiz-play/daily-quiz-dashboard`
- **Component**: `src/pages/quiz-play/daily-quiz-dashboard/index.jsx`
- **Layout**: Direct quiz interface

### Features
- **Daily Questions**: New questions each day
- **Timer**: Configurable via `quiz_zone_duration` setting
- **Lifeline System**: Help features during quiz
- **One-Time Play**: Users can only play once per day
- **API Integration**: `dailyQuizApi`

### Error Handling
- **Already Played**: Error 112 - "already_played"
- **No Questions**: Error 102 - "no_que_found"
- **User Feedback**: Toast notifications for errors

---

## 5. True & False Quiz (`/quiz-play/true-and-false-play`)

### Page Structure
- **URL**: `/quiz-play/true-and-false-play`
- **Component**: `src/pages/quiz-play/true-and-false-play/index.jsx`
- **Layout**: Simple true/false interface

### Features
- **Question Format**: True/False questions only
- **Timer**: Configurable via `true_false_quiz_in_seconds` setting
- **API Integration**: `trueandfalsequestionsApi`
- **Quick Format**: Fast-paced revision sessions

---

## Technical Implementation

### State Management
- **Redux Integration**: Comprehensive state management
- **Progress Tracking**: User progress across all modules
- **Temporary Data**: Quiz session data management
- **User Data**: Authentication and subscription status

### API Integration
- **Categories API**: `categoriesApi` for subject selection
- **Questions API**: Various question APIs per module
- **Progress API**: User progress tracking
- **User API**: Authentication and user data

### Error Handling
- **Network Errors**: Fallback questions and retry mechanisms
- **Authentication Errors**: Redirect to login
- **Subscription Errors**: Redirect to pricing
- **Data Errors**: User-friendly error messages

### Performance Optimizations
- **Dynamic Imports**: Lazy loading of components
- **Suspense Boundaries**: Loading states for better UX
- **Skeleton Components**: Loading placeholders
- **Error Boundaries**: Graceful error handling

### Responsive Design
- **Mobile-First**: Responsive grid layout
- **Touch-Friendly**: Optimized for mobile interaction
- **Progressive Enhancement**: Works across all devices

---

## User Experience Flow

### Typical User Journey
1. **Landing**: User arrives at `/quiz-play`
2. **Selection**: Chooses desired quiz type
3. **Authentication**: Login/subscription check
4. **Navigation**: Follows subject-specific flow
5. **Practice**: Completes quiz questions
6. **Results**: Reviews performance and progress
7. **Review**: Optionally reviews answers
8. **Progression**: Advances to next level or returns

### Accessibility Features
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **Color Contrast**: Accessible color schemes
- **Error Messages**: Clear, descriptive error handling

---

## Configuration & Customization

### System Settings
- **Quiz Durations**: Configurable timers per quiz type
- **Feature Toggles**: Enable/disable specific quiz types
- **Icon Management**: Customizable icons via web settings
- **Content Management**: Dynamic content via API

### Localization
- **Multi-Language**: i18n support for all text
- **Dynamic Content**: Language-specific content
- **RTL Support**: Right-to-left language support

---

*This documentation reflects the current quiz-play implementation as of the latest codebase analysis. The system provides a comprehensive, AI-powered learning experience with multiple subject areas, progress tracking, and adaptive difficulty levels.*

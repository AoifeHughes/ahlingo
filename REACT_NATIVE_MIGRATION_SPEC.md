# AHLingo React Native Migration Specification

## Executive Summary

This document provides a comprehensive specification for migrating the AHLingo language learning application from Kivy/Python to React Native. The current app is a SQLite-based language learning platform with matching games, conversation exercises, and AI chatbot integration.

## Current Application Architecture

### Technology Stack
- **Frontend**: Kivy + KivyMD (Material Design)
- **Backend**: Python with SQLite database
- **UI**: KV language (embedded in Python files)
- **Database**: SQLite with 13 tables and complex relationships
- **AI Integration**: llama-cpp-python for local LLM
- **Platform**: iOS (with Android capability)

### Application Structure
```
AHLingo/
├── main.py                 # App entry point
├── app/
│   ├── AHLingo.py         # Main app class
│   └── screens/           # Screen implementations
├── database/              # SQLite database file
├── content/               # Database management & content generation
└── build_ios.sh          # iOS build script
```

## Screen Analysis

### 1. Main Menu Screen
- **Purpose**: Navigation hub for all app features
- **Components**: 5 navigation buttons (Pairs, Conversation, Translation, Chatbot, Settings)
- **Data**: No database interactions
- **Navigation**: Routes to 5 different feature screens

### 2. Settings Screen
- **Purpose**: User preferences and configuration
- **Components**: 
  - Language dropdown (from database)
  - Difficulty dropdown (from database)
  - API configuration fields
  - Save functionality
- **Data Operations**:
  - Load: `get_user_settings()`, `get_languages()`, `get_difficulty_levels()`
  - Save: Multiple `set_user_setting()` calls
- **Form Handling**: Auto-population, validation, fallback defaults

### 3. Topic Selection Screen
- **Purpose**: Choose learning topic for exercises
- **Components**: Scrollable grid of topic cards
- **Data Operations**: `get_topics_by_language_difficulty()`
- **Filtering**: Based on user's language and difficulty settings
- **Navigation**: To Pairs Game with selected topic

### 4. Pairs Game Screen (Most Complex)
- **Purpose**: Matching game with language pairs
- **Components**: 
  - Two-column layout with shuffled buttons
  - Score tracking (correct/incorrect)
  - Refresh functionality
- **Game Logic**:
  - Single selection per column
  - Color-coded states (blue → gray → green)
  - Match validation with 1-second delay for errors
  - Independent column shuffling
- **Data Operations**: `get_random_pair_exercise()` with lesson grouping
- **Advanced Features**: Lesson-based grouping, fallback to random selection

### 5. Stub Screens (Ready for Development)
- **Conversation Exercises**: Placeholder implementation
- **Translation Exercises**: Placeholder implementation  
- **Chatbot**: Placeholder implementation

## Database Schema

### Core Tables Structure
```sql
-- Reference tables
languages (id, language)
topics (id, topic) 
difficulties (id, difficulty_level)

-- Central hub
exercises_info (id, exercise_name, topic_id, difficulty_id, language_id, exercise_type, lesson_id)

-- Exercise content
pair_exercises (id, exercise_id, language_1, language_2, language_1_content, language_2_content)
conversation_exercises (id, exercise_id, conversation_order, speaker, message)
translation_exercises (id, exercise_id, language_1, language_2, language_1_content, language_2_content)

-- User management
users (id, name, last_login)
user_settings (id, user_id, setting_name, setting_value)
user_exercise_attempts (id, user_id, exercise_id, is_correct, attempt_date)

-- AI integration
chat_details (id, user_id, language, difficulty, model, created_at, last_updated)
chat_histories (id, chat_id, role, content, timestamp)

-- Media
pronunciation_audio (id, text, language, audio_data, exercise_type, topic, difficulty, created_at)
```

### Key Relationships
- `exercises_info` serves as central hub connecting all reference tables
- User settings stored as key-value pairs
- Exercise attempts tracked for analytics
- Chat system supports conversation history
- Audio data cached as BLOB for offline use

### Current Data Volume
- **Languages**: 1 (French)
- **Topics**: 9 (Greetings, Numbers, World of Warcraft, etc.)
- **Difficulties**: 3 (Beginner, Intermediate, Advanced)
- **Exercises**: 158 total (51 pairs, 53 conversation, 54 translation)
- **Pairs**: 218 word/phrase pairs
- **Conversations**: 1,124 messages
- **Translations**: 279 translation pairs

## Data Flow Patterns

### Primary User Journey
```
App Start → Database Init → User Session
    ↓
Main Menu (no data) → Topic Selection
    ↓
Load user settings → Filter topics by language/difficulty
    ↓
Select topic → Pairs Game
    ↓
Load exercises → Shuffle pairs → Game interaction
```

### Data Persistence
- **Settings**: Immediate save to database on form submission
- **Game Progress**: Real-time score tracking (not persisted)
- **User Sessions**: Login timestamp tracking
- **Exercise Attempts**: Could be tracked (infrastructure exists)

### Error Handling
- **Fallback Defaults**: French/Beginner if settings not found
- **Empty States**: Graceful handling of no available content
- **User Creation**: Auto-create "default_user" if none exists

## React Native Migration Plan

### Phase 1: Foundation Setup
1. **Project Initialization**
   - Create React Native project with TypeScript
   - Set up navigation (React Navigation 6)
   - Configure state management (Redux Toolkit)
   - Set up UI library (React Native Elements or NativeBase)

2. **Database Migration**
   - Choose data persistence strategy (SQLite vs. AsyncStorage vs. API)
   - Set up database schema and migrations
   - Implement data access layer
   - Create seed data scripts

3. **Core Architecture**
   - Implement navigation structure
   - Set up state management patterns
   - Create base screen components
   - Implement theme and styling system

### Phase 2: Screen Implementation
1. **Main Menu Screen**
   - Static navigation component
   - Material Design button components
   - Platform-specific styling

2. **Settings Screen**
   - Form components with validation
   - Dropdown components
   - AsyncStorage for settings persistence
   - User preference management

3. **Topic Selection Screen**
   - Grid layout with cards
   - API integration for topic loading
   - Loading states and error handling
   - Navigation to game screen

4. **Pairs Game Screen**
   - Complex game logic implementation
   - Two-column layout with buttons
   - Animation and state management
   - Score tracking and persistence

### Phase 3: Advanced Features
1. **Conversation Exercises**
   - Chat-like interface
   - Message ordering and display
   - Audio integration planning

2. **Translation Exercises**
   - Input validation
   - Feedback mechanisms
   - Progress tracking

3. **Chatbot Integration**
   - AI API integration
   - Chat history management
   - Real-time messaging

### Phase 4: Polish and Optimization
1. **Performance Optimization**
   - Lazy loading for large datasets
   - Image optimization
   - Bundle size optimization

2. **Offline Support**
   - Exercise caching
   - Offline-first architecture
   - Sync capabilities

3. **Platform-Specific Features**
   - Native navigation patterns
   - Platform-specific UI adjustments
   - Push notifications (future)

## Technical Decisions

### Data Persistence Strategy
**Recommended**: SQLite with react-native-sqlite-storage
- **Pros**: Maintains current data structure, supports complex queries
- **Cons**: Requires native modules, migration complexity
- **Alternative**: AsyncStorage for simple data + API for exercises

### State Management
**Recommended**: Redux Toolkit with RTK Query
- **Pros**: Handles complex state, caching, and API integration
- **Cons**: Learning curve, setup complexity
- **Alternative**: Context API for simpler needs

### UI Library
**Recommended**: React Native Elements
- **Pros**: Material Design support, extensive components
- **Cons**: Bundle size, customization limitations
- **Alternative**: NativeBase or custom components

### Navigation
**Recommended**: React Navigation 6
- **Pros**: Industry standard, extensive features
- **Cons**: Bundle size
- **Alternative**: Native navigation for performance

## Component Mapping

### Kivy → React Native Component Mapping
```
MDScreen → Screen (React Navigation)
MDTopAppBar → Header (React Navigation)
MDRaisedButton → Button (React Native Elements)
MDCard → Card (React Native Elements)
MDBoxLayout → View with flexbox
MDGridLayout → FlatList or custom grid
MDTextField → Input (React Native Elements)
MDDropdownMenu → Picker or custom dropdown
MDScrollView → ScrollView
MDLabel → Text
```

### Custom Components Needed
1. **MenuButton**: Main menu navigation buttons
2. **TopicCard**: Topic selection cards
3. **PairButton**: Game buttons with state management
4. **SettingsItem**: Settings form components
5. **GameScore**: Score display component

## Migration Challenges

### Technical Challenges
1. **Complex Game Logic**: Pairs game has sophisticated state management
2. **Database Queries**: Complex JOINs need translation to simpler queries
3. **BLOB Data**: Audio files need special handling
4. **Platform Differences**: iOS-specific spacing and behavior

### Data Challenges
1. **Schema Migration**: 13 tables with foreign key relationships
2. **Content Volume**: 1000+ conversation messages, 200+ pairs
3. **User Data**: Settings and progress preservation
4. **Audio Integration**: Pronunciation audio caching

### UI/UX Challenges
1. **Material Design**: Maintaining consistent visual design
2. **Navigation Patterns**: Preserving current user flows
3. **Performance**: Smooth animations and transitions
4. **Accessibility**: Screen reader support and accessibility features

## Success Metrics

### Functional Parity
- [ ] All current screens implemented
- [ ] Database functionality preserved
- [ ] Game logic accuracy maintained
- [ ] Settings persistence working
- [ ] Navigation flows identical

### Performance Targets
- [ ] App startup time < 3 seconds
- [ ] Screen transitions < 300ms
- [ ] Database queries < 100ms
- [ ] Memory usage < 100MB

### User Experience
- [ ] Visual design consistency
- [ ] Smooth animations
- [ ] Offline functionality
- [ ] Error handling robustness

## Timeline Estimate

### Phase 1: Foundation (3-4 weeks)
- Project setup and architecture
- Database migration
- Core navigation

### Phase 2: Core Screens (4-5 weeks)
- Main Menu, Settings, Topic Selection
- Basic Pairs Game implementation

### Phase 3: Advanced Features (3-4 weeks)
- Complete Pairs Game logic
- Stub screen implementations
- Polish and optimization

### Phase 4: Testing and Deployment (2-3 weeks)
- Comprehensive testing
- Platform-specific optimizations
- App store preparation

**Total Estimated Timeline**: 12-16 weeks

## Risk Mitigation

### High-Risk Items
1. **Pairs Game Logic**: Complex state management
   - **Mitigation**: Implement incrementally, extensive testing
   
2. **Database Migration**: Data integrity concerns
   - **Mitigation**: Comprehensive migration scripts, rollback plan
   
3. **Performance**: Large dataset handling
   - **Mitigation**: Implement pagination, lazy loading

### Medium-Risk Items
1. **UI Consistency**: Maintaining Material Design
   - **Mitigation**: Design system, component library
   
2. **Navigation**: Complex screen flows
   - **Mitigation**: Navigation testing, user journey validation

## Conclusion

The AHLingo React Native migration is a significant undertaking that will modernize the app's architecture while preserving its core functionality. The current Kivy implementation provides a solid foundation with well-structured data models and clear screen responsibilities.

Key success factors include:
- Careful database migration planning
- Incremental implementation approach
- Comprehensive testing at each phase
- Maintaining user experience consistency

The estimated timeline of 12-16 weeks accounts for the complexity of the Pairs Game logic and database migration requirements. With proper planning and execution, this migration will result in a more maintainable, performant, and feature-rich language learning application.
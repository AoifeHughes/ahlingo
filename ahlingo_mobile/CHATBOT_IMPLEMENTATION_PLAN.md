# Chatbot Implementation Plan

## 🎯 **Overview**
Implement a full-featured OpenAI-compatible chatbot with conversation management, leveraging existing database schema and UI components. Keep it simple with direct fetch API calls.

## 📊 **Database Integration**
- **Existing Schema**: 
  - `ChatDetail`: chat metadata (user_id, language, difficulty, model, timestamps)
  - `ChatHistory`: individual messages (chat_id, role, content, timestamp)
- **New SQL Queries**: Add chat-specific queries to `constants.ts`
- **New Service**: Create `ChatService.ts` for all chat operations

## 🎨 **UI Components** 
- **Reuse Existing**: `ConversationView` and `MessageBubble` components
- **New Components**:
  - `ChatInput`: Text input area with send button
  - `ConversationsList`: Slide-out panel for chat management
  - `ChatMessage`: Enhanced MessageBubble for user/assistant roles

## 📱 **Screen Layout**
```
[Header with conversations panel toggle]
[ConversationView - scrollable messages]
[ChatInput - text field + send button]
```

## 🔧 **Core Features**
1. **Message Management**: Send/receive, persist to database
2. **OpenAI Integration**: Direct fetch API calls to custom endpoints
3. **Conversation Management**: Create, rename, delete, browse conversations
4. **System Prompt**: Dynamic prompt based on user's language/difficulty settings
5. **Offline Browsing**: View existing conversations when API unavailable

## 🌐 **OpenAI API Integration (Simple Fetch)**
- **No External Dependencies**: Use React Native's built-in `fetch()`
- **Custom Endpoints**: Works with any OpenAI-compatible server using settings (hostname, apiUrl, apiKey)
- **Message Format**: Transform ChatHistory to OpenAI chat completion format
- **System Prompt**: "You are a language learning assistant. Always attempt to speak in [language] at [difficulty] level. Encourage the user to learn and practice in [language]. Respond in English when specifically asked by the user."
- **Error Handling**: Network timeouts, API failures, invalid responses
- **Request Format**:
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "system prompt"},
    {"role": "user", "content": "user message"},
    {"role": "assistant", "content": "ai response"}
  ]
}
```

## 📋 **Implementation Steps**
1. Add chat SQL queries to `constants.ts`
2. Create `ChatService.ts` for database operations
3. Create `OpenAIService.ts` using fetch() for API calls
4. Build `ChatInput` component with TextInput + send button
5. Build `ConversationsList` slide-out panel for chat management
6. Implement main `ChatbotScreen` with message display
7. Add conversation CRUD operations (create, rename, delete)
8. Implement comprehensive error handling and offline mode
9. Add loading states and user feedback

## 🔄 **User Flow**
1. User opens chatbot → loads recent conversation or creates new
2. User types message → saves to DB → API call with fetch() → displays response
3. User can slide out panel → browse/rename/delete conversations
4. Handles API errors gracefully, allows offline browsing of existing chats
5. System prompt adapts to user's current language/difficulty settings

## ⚙️ **Settings Integration**
- Read `api_key`, `api_url`, `hostname` from user settings
- Use current `language` and `difficulty` for system prompt
- Fallback to default OpenAI endpoint if custom URL not set
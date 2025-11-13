# AI Tutor Backend - Cloudflare Workers

Production-ready multi-agent AI Tutor backend built with Cloudflare Workers, Workers AI, KV, Durable Objects, and D1.

## Architecture

This backend implements a multi-agent tutoring system with the following components:

### Core Components

1. **CoordinatorAgent** - Master orchestrator that routes requests to appropriate agents
2. **TutorAgent** - Primary teaching agent with conversation engine
3. **Supporting Agents** - Content, Evaluation, Difficulty, Engagement, Analytics, Planner
4. **Memory System** - Short-term (in-memory), Medium-term (KV), Long-term (Durable Objects)
5. **Safety Engine** - Ensures responses follow identity rules and safety constraints
6. **Routing Engine** - Intent detection and agent routing

## Project Structure

```
src/
├── ai/
│   ├── agents/          # All agent implementations
│   ├── coordinator/      # CoordinatorAgent (the brain)
│   ├── providers/       # WorkersAIProvider, RateLimiter
│   ├── logic/           # RoutingEngine, SafetyEngine, ConversationEngine
│   ├── memory/          # Memory management classes
│   ├── schemas/         # TypeScript interfaces
│   ├── utils/           # Helper utilities
│   └── config/          # IdentityRules
├── api/                 # API route handlers
├── storage/             # KV, D1, Durable Object implementations
├── middleware/          # Request processing middleware
├── config/             # Configuration files
└── index.ts            # Worker entry point
```

## Setup

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI installed globally or via npm

### Installation

```bash
npm install
```

### Cloudflare Setup

1. **Create KV Namespaces:**
```bash
wrangler kv:namespace create SESSION_KV
wrangler kv:namespace create PROGRESS_KV
wrangler kv:namespace create ANALYTICS_KV
```

2. **Create D1 Database:**
```bash
wrangler d1 create analytics-db
```

3. **Create Durable Object:**
The Durable Object is automatically configured in `wrangler.toml`.

4. **Update wrangler.toml:**
Replace placeholder IDs with your actual namespace/database IDs from the commands above.

5. **Run D1 Migrations:**
```bash
wrangler d1 execute analytics-db --file=./src/storage/d1/schema.sql
```

### Development

```bash
# Run frontend (existing)
npm run dev

# Run backend worker
npm run dev:worker
```

### Deployment

```bash
npm run deploy:worker
```

## API Endpoints

### POST /api/tutor/chat
Main chat endpoint for tutor interactions.

**Request:**
```json
{
  "message": "Hello, I want to learn calculus",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "message": "Hello! I'm Kaelo, your AI tutor...",
  "sessionId": "session-id",
  "metadata": {
    "agent": "Tutor",
    "task": "teach",
    "timestamp": 1234567890
  }
}
```

### Other Endpoints (Placeholders)
- `/api/tutor/evaluate` - Exercise evaluation
- `/api/tutor/plan` - Learning plan generation
- `/api/tutor/content` - Content generation
- `/api/tutor/session` - Session management
- `/api/tutor/analytics` - Analytics retrieval

## Key Features

### Multi-Agent Architecture
- CoordinatorAgent routes requests intelligently
- Each agent has a specific role and responsibility
- Agents can collaborate through the coordinator

### Memory System
- **Short-term**: Last 5 messages in memory
- **Medium-term**: Session metadata in KV
- **Long-term**: Full conversation history in Durable Objects

### Safety & Identity
- All responses follow IdentityRules
- SafetyEngine checks for contradictions and tone issues
- Responses are validated and formatted before sending

### Rate Limiting
- IP-based, user-based, and session-based limits
- KV-backed counters for edge-safe implementation
- Configurable limits per minute/hour/day

## Configuration

### Identity Rules
Located in `src/ai/config/IdentityRules.ts` - contains all tutor personality, teaching style, and safety rules.

### Settings
Located in `src/config/settings.ts` - rate limits, AI model settings, memory settings.

## Next Steps

1. **Configure Cloudflare Resources:**
   - Set up KV namespaces
   - Create D1 database
   - Update wrangler.toml with actual IDs

2. **Test the Chat Endpoint:**
   - Use `npm run dev:worker` to start local development
   - Test with curl or Postman

3. **Integrate with Frontend:**
   - Update frontend to call `/api/tutor/chat`
   - Handle session management

4. **Enhance Agents:**
   - Implement full logic for supporting agents
   - Add more sophisticated evaluation logic
   - Enhance routing engine with better intent detection

## Notes

- The CoordinatorAgent is the brain of the system and must be working correctly
- All agents follow the shared JSON schema for requests/responses
- TutorAgent finalizes all responses to ensure consistency
- Memory is layered for optimal performance and persistence




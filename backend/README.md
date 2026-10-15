# Schedly Backend

AI-powered calendar assistant backend built with FastAPI and LangGraph. Translates natural language into calendar operations using stateful agent architecture.

## Tech Stack

- **Framework**: FastAPI 0.142 (async Python)
- **AI Agent**: LangGraph 1.2 with OpenRouter LLMs
- **Database**: PostgreSQL (asyncpg) + SQLModel ORM
- **Auth**: JWT + Argon2 password hashing
- **External APIs**: Google Calendar API (OAuth 2.0)
- **Migrations**: Alembic (7 production migrations)

## Architecture

```mermaid
graph TB
    Client[Frontend]
    API[FastAPI]
    Agent[LangGraph Agent]
    Tools[8 Calendar Tools]
    GCal[Google Calendar API]
    DB[(PostgreSQL)]
    
    Client -->|HTTP/JSON| API
    API --> Agent
    Agent -->|LLM| OpenRouter
    Agent --> Tools
    Tools --> GCal
    Tools --> DB
    Agent -.->|Checkpoints| DB
    
    style Agent fill:#e1bee7
```

### Module Structure

```
backend/app/
├── main.py                      # FastAPI app + lifespan
├── api.py                       # Router aggregation
├── core/
│   ├── config.py               # Pydantic settings (env-based)
│   ├── security.py             # JWT + Argon2 hashing
│   └── logging.py              # Structured logging
├── database/
│   ├── session.py              # AsyncEngine + connection pooling
│   └── redis.py                # Cache layer
└── modules/
    ├── auth/                   # User auth + refresh tokens
    │   ├── service.py         # Token operations
    │   └── dependencies.py    # get_current_user()
    ├── google_calendar/        # OAuth + Calendar client
    │   ├── client.py          # get_google_calendar_client()
    │   └── service.py         # Calendar business logic
    ├── preferences/            # User scheduling preferences
    └── agent/                  # LangGraph implementation
        ├── gragh.py           # Graph compilation
        ├── tools.py           # 8 calendar tools
        ├── services.py        # DI for tools
        ├── state.py           # ChatState definition
        └── routes.py          # Chat endpoints
```

## Authentication

Schedly implements **two-layer authentication**: JWT for API access, OAuth 2.0 for Google Calendar.

### 1. App Authentication (JWT)

**Two-Token System:**

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB

    Client->>API: POST /auth/login
    API->>DB: Verify password hash
    API->>API: Generate tokens
    API->>DB: Store hashed refresh token
    API-->>Client: {access_token, refresh_token}
    
    Note over Client: Access token expires (30 min)
    
    Client->>API: POST /auth/refresh
    API->>DB: Verify + revoke old token
    API->>API: Generate new tokens
    API-->>Client: {access_token, refresh_token}
```

**Token Types:**

| Token | Lifespan | Storage | Purpose |
|-------|----------|---------|---------|
| **Access Token (JWT)** | 30 minutes | Client memory | API authorization (Bearer) |
| **Refresh Token** | 7 days | DB (SHA-256 hashed) | Access token renewal |

**Key Implementation:**
- **Access Token**: JWT with `{sub: user_id, email, exp, iat}` - validated via `get_current_user()` in `auth/dependencies.py`
- **Refresh Token**: SHA-256 hashed before storage - single-use rotation in `auth/service.py:verify_refresh_token()`
- **Password Security**: Argon2id via `passlib` - memory-hard, side-channel resistant (see `core/security.py`)

**Multi-Device Sessions:**
- Each refresh token stores device metadata (IP, User-Agent, device name)
- `auth/service.py:get_user_sessions()` lists active devices
- `auth/service.py:revoke_all_user_tokens()` enables account-wide logout

### 2. Google Calendar Authentication (OAuth 2.0)

**OAuth Flow with Redis State Management:**

```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Redis
    participant Google
    participant DB

    User->>Backend: GET /calendar/google/connect
    Backend->>Backend: Generate random state token
    Backend->>Redis: SET oauth:google:{state} = user_id<br/>(TTL: 10 min)
    Backend-->>User: Redirect to Google OAuth URL + state
    User->>Google: Authorize Schedly
    Google->>Backend: GET /callback?code=...&state=...
    Backend->>Redis: GET oauth:google:{state}
    Redis-->>Backend: user_id (CSRF verified)
    Backend->>Redis: DELETE oauth:google:{state}
    Backend->>Google: Exchange code for tokens
    Google-->>Backend: {access_token, refresh_token}
    Backend->>Backend: Encrypt tokens (Fernet)
    Backend->>DB: Store encrypted tokens
    Backend-->>User: Redirect to frontend
```

**Redis Role in OAuth (CSRF Protection):**

Redis stores temporary OAuth state mappings to prevent CSRF attacks:

1. **State Generation** (`google_calendar/router.py:connect_google_calendar()`):
   - Generate cryptographically secure random token (32 bytes)
   - Store mapping: `oauth:google:{state}` → `user_id` with 10-minute TTL
   - Include state in OAuth authorization URL

2. **State Validation** (`google_calendar/router.py:google_callback()`):
   - Fetch `user_id` from Redis using state from callback
   - Verify state exists (not expired, not tampered)
   - Delete state immediately after it has been consumed (single-use consumption)
   - Exchange authorization code for tokens

**Why Redis is Required:**

| Storage Option | Problem |
|----------------|---------|
| **Database** | Too slow for high-frequency OAuth redirects, no native TTL |
| **JWT/Cookie** | State token would be client-controlled (security risk) |
| **In-Memory Dict** | Lost on server restart, doesn't work with multi-instance deployment |
| **Redis** | Fast, atomic operations, native TTL, works across instances |

**Security Properties:**
- **Single-Use**: State deleted immediately after validation
- **Time-Bound**: 10-minute TTL prevents replay attacks
- **User-Bound**: State are mappped to specific user and can't be reused for different account
- **Random**: 32-byte URL-safe token (256-bit entropy) prevents guessing

**Configuration:**
- Redis connection string: `REDIS_URL=redis://localhost:6379`
- State key pattern: `oauth:google:{state}`
- TTL: 600 seconds (10 minutes)
- See `database/redis.py` for connection setup

**Key Implementation:**
- **Authorization**: `google_calendar/router.py:connect_google_calendar()` generates OAuth URL with state parameter
- **Token Exchange**: `google_calendar/router.py:google_callback()` validates state via Redis before exchanging code
- **Encryption**: Tokens encrypted with Fernet (AES-128) before DB storage
- **Auto-Refresh**: `google_calendar/client.py:get_google_calendar_client()` checks expiry, refreshes if needed

**Token Refresh Strategy:**
- Access tokens expire after 1 hour
- Refresh happens synchronously within DB transaction to prevent race conditions
- Failed refresh triggers re-authentication (user must reconnect)

**Database Model:**
- `GoogleConnection` table: `user_id`, `google_email`, `access_token` (encrypted), `refresh_token` (encrypted), `token_expires_at`
- One connection per user (unique constraint on `user_id`)

## LangGraph Agent Design

### Graph Structure

**Stateful conversation graph** (not simple prompt-response loop):

```mermaid
graph LR
    Start([User Message])
    Chat[Chat Node<br/>LLM + Bound Tools]
    Tools[Tool Execution]
    End([Response])
    
    Start --> Chat
    Chat -->|tool_calls| Tools
    Chat -->|no tools| End
    Tools --> Chat
```

**Implementation:**
- **Graph Definition**: `agent/gragh.py` - compiles StateGraph with chat node + tool node
- **Chat Node**: `_call_model()` - injects user timezone into system prompt, invokes LLM
- **Checkpointing**: `AsyncPostgresSaver` for production (persistent conversations), `MemorySaver` for local dev
- **State**: `agent/state.py:ChatState` - extends `MessagesState` with `user_timezone` field

### Tool Suite

8 LangGraph tools in `agent/tools.py`:

| Tool | Purpose | Key Features |
|------|---------|--------------|
| `list_calendars` | Enumerate accessible calendars | Filters by `minAccessRole=freeBusyReader` |
| `get_events` | Fetch events in time range | Multi-calendar aggregation, preference filtering |
| `check_free` | Batch availability check | Single freebusy query, interval merging |
| `find_slots` | Open meeting slot discovery | Working hours + buffer + minimum notice |
| `create_event` | Insert calendar event | Timezone-aware, attendee invites |
| `update_event` | Patch event fields | Partial updates, fetches current state |
| `delete_event` | Remove event | Confirmation-gated deletion |
| `get_event` | Single event retrieval | By ID + calendar ID |

**Tool Design Pattern:**
- Tools decorated with `@tool` from `langchain_core.tools`
- Extract `user_id` and `db_session` from `RunnableConfig` via `agent/services.py:get_google_client_from_config()`
- Return `{"success": bool, "error": str | None, ...}` for consistent error handling
- All failures logged, never thrown (agent continues conversation)

## Google Calendar Integration

### Service Layer Design

**Philosophy**: Business logic in `google_calendar/service.py` is decoupled from OAuth. All functions accept pre-authenticated `Resource` client.

**Key Algorithms:**

#### 1. Multi-Calendar Event Fetching

**Function**: `google_calendar/service.py:fetch_events_all_calendars()`

**Strategy**:
- Fetch calendar list once
- Filter by `selected_calendar_ids` from user preferences (empty = all calendars)
- Priority-based ordering: Primary to User-owned to Holiday calendars
- Query sequentially (Google API client not thread-safe)
- Sort all events by `start_time`

**Trade-off**: Sequential queries avoid SSL issues with `googleapiclient`. Parallelism would require per-request client instantiation (higher overhead).

#### 2. Available Slot Finding

**Function**: `google_calendar/service.py:find_available_slots()`

**Algorithm**:
1. Single freebusy query for entire date range (O(1) API calls)
2. Merge overlapping busy intervals via `_merge_intervals()`
3. Walk working hours day-by-day, skipping blocked intervals
4. Apply user preferences: working hours, working days, buffer minutes, minimum notice
5. Return up to `max_results` slots

**Trade-off**: Single freebusy query (O(1)) vs. per-day queries (O(n_days)). Memory footprint negligible for merged intervals.

#### 3. Event Normalization

**Function**: `google_calendar/service.py:_normalise_event()`

Maps raw Google Calendar API responses to consistent schema:
```python
{
    "id": str,
    "calendar_id": str,
    "title": str,
    "start_time": datetime,  # ISO 8601
    "end_time": datetime,
    "timezone": str | None,
    "description": str | None,
    "location": str | None,
    "attendees": list[str],
    "status": str,
    "html_link": str
}
```

### OAuth Token Management

**Challenge**: Concurrent requests can trigger simultaneous token refreshes, invalidating one refresh token.

**Solution** (in `google_calendar/client.py:get_google_calendar_client()`):
- Refresh is synchronous within DB transaction
- SQLModel session prevents concurrent updates to same `GoogleConnection` row
- Decryption, expiry check, refresh if needed, re-encryption, DB commit

**Flow**:
1. Fetch `GoogleConnection` for user (row lock acquired)
2. Decrypt tokens with Fernet
3. Check if access token expired
4. If expired: call `credentials.refresh(Request())`
5. Update DB with new access token + expiry
6. Commit transaction (releases lock)
7. Build Google Calendar API client

## Database Schema

```mermaid
erDiagram
    User ||--o{ RefreshToken : "has"
    User ||--o| GoogleConnection : "has"
    User ||--o{ AIConversation : "creates"
    User ||--o| UserPreferences : "has"
    AIConversation ||--o{ AIMessage : "contains"

    User {
        uuid id PK
        string email UK
        string password_hash
        string avatar_url
    }

    RefreshToken {
        uuid id PK
        uuid user_id FK
        string token_hash "SHA-256"
        datetime expires_at
        datetime revoked_at
        string device_name
        string ip_address
        string user_agent
    }

    GoogleConnection {
        uuid id PK
        uuid user_id FK "unique"
        string google_email
        string access_token "encrypted"
        string refresh_token "encrypted"
        datetime token_expires_at
    }

    UserPreferences {
        uuid id PK
        uuid user_id FK
        string timezone
        time working_hours_start
        time working_hours_end
        array working_days
        int buffer_minutes
        int minimum_notice_minutes
        array selected_calendar_ids
    }

    AIConversation {
        uuid id PK
        uuid user_id FK
        string title
    }

    AIMessage {
        uuid id PK
        uuid conversation_id FK
        string role "user|assistant"
        string content
        jsonb tool_calls
    }
```

### Migration History

7 Alembic migrations in `backend/alembic/versions/`:

| Migration | Description |
|-----------|-------------|
| `a9e267ac5724` | Initial auth models (User, RefreshToken) |
| `8f4d283dcbf8` | Google Calendar OAuth connections |
| `c24e93d5c8a1` | Token encryption (plaintext → Fernet) |
| `680ed9f310c9` | Agent conversation models (AIConversation, AIMessage) |
| `ad7cfb62fb38` | User preferences (working hours, calendar filtering) |
| `2b2e4bc7de58` | Avatar URLs |
| `3bcdac0e2caf` | Cleaned up AIMessage fields |

## Key Engineering Decisions

### 1. Async Postgres Connection Pooling

**Problem**: SQLAlchemy + asyncpg can have stale connection issues under high concurrency.

**Solution** (in `database/session.py`):
```python
engine = create_async_engine(
    settings.database_url,
    pool_pre_ping=True,              # Verify connection before use
    connect_args={
        "statement_cache_size": 0    # Disable asyncpg prepared stmt cache
    },
    execution_options={
        "compiled_cache": None        # Disable SQLAlchemy compiled cache
    }
)
```

**Trade-off**: Slight performance hit for reliability. `pool_pre_ping` recycles dead connections automatically.

### 2. LangGraph Checkpointing Strategy

**Implementation** (in `agent/gragh.py:_build_checkpointer()`):
- **Production**: `AsyncPostgresSaver` with dedicated connection pool (conversation persistence across restarts)
- **Local Dev**: `MemorySaver` fallback if `LANGGRAPH_DB_URL` unset (conversations don't survive restarts)

**Why Postgres Checkpointing**:
- Conversations survive across server restarts
- Multi-instance deployment support (load balancing)
- Full conversation history queryable

### 3. Timezone Handling

**Strategy**: All datetime operations use timezone-aware objects via `zoneinfo.ZoneInfo` (Python 3.9+ stdlib).

**Implementation**:
- **Storage**: Always UTC in database
- **Conversion**: At presentation layer using user's timezone from preferences
- **Agent Context**: User timezone injected into system prompt on every turn (see `agent/gragh.py:_call_model()`)

**Pitfalls Avoided**:
- Naive datetime arithmetic (breaks DST transitions)
- `pytz` (deprecated, use `zoneinfo`)
- Use `datetime.now(tz)` not `datetime.now().replace(tzinfo=tz)`

**Key Functions**:
- `google_calendar/service.py:_get_zoneinfo()` - safely obtain tzinfo object
- `google_calendar/service.py:_localize_dt()` - attach or convert timezone
- `google_calendar/service.py:_to_rfc3339()` - format for Google Calendar API

### 4. Redis for OAuth State Management

**Requirement**: Redis is **required** for secure OAuth flows. It stores temporary state tokens that prevent CSRF attacks.

**Implementation** (in `google_calendar/router.py`):

The OAuth flow uses Redis to create a secure, single-use mapping between a state token and the authenticating user:

1. **State Generation** (`connect_google_calendar()`):
   - Generate cryptographically secure random token: `secrets.token_urlsafe(32)` (256-bit entropy)
   - Store in Redis: `oauth:google:{state}` → `user_id` (TTL: 10 minutes)
   - Attach state to OAuth authorization URL sent to Google

2. **State Validation** (`google_callback()`):
   - Google redirects back with `?code=...&state=...`
   - Fetch `user_id` from Redis using state parameter
   - Verify state exists (not expired, not tampered)
   - Delete state immediately (single-use consumption)
   - Exchange authorization code for tokens

**Why Redis (not alternatives)**:

| Alternative | Problem |
|-------------|---------|
| **Database** | Too slow for OAuth redirects, no native TTL support |
| **JWT/Cookie** | Client-controlled, can be forged (defeats CSRF protection) |
| **In-Memory Dict** | Lost on server restart, breaks with load balancers |
| **Redis** | Sub-millisecond reads, atomic ops, native TTL, distributed |

**Security Properties**:
- **Single-Use**: State deleted immediately after validation (prevents replay attacks)
- **Time-Bound**: 10-minute TTL (expired states rejected)
- **User-Bound**: State maps to specific user ID (can't be reused for different account)
- **Random**: 32 bytes URL-safe (impossible to guess or enumerate)

**Configuration**:
- Connection: `REDIS_URL=redis://localhost:6379`
- Key pattern: `oauth:google:{state}`
- TTL: `OAUTH_STATE_TTL = 600` seconds
- See `database/redis.py` for async connection setup

### 5. LangGraph vs. Raw LangChain

**Why LangGraph over `AgentExecutor`:**

| Feature | LangGraph | AgentExecutor |
|---------|-----------|---------------|
| **Graph Structure** | Explicit (chat → tools → chat) | Implicit loop |
| **Checkpointing** | First-class Postgres support | Manual implementation |
| **State Inspection** | Full graph state accessible | Black box |
| **Debugging** | Graph visualizations | Print statements |
| **Error Recovery** | Conditional edges | Try-catch |

### 5. Tool Dependency Injection

## API Endpoints

### Authentication (`/auth`)
- `POST /register` - Create account (returns tokens)
- `POST /login` - Authenticate (returns tokens)
- `POST /refresh` - Refresh access token
- `POST /logout` - Revoke refresh token
- `GET /me` - Current user profile

### Google Calendar (`/google-calendar`)
- `GET /auth/url` - Generate OAuth URL
- `GET /callback` - OAuth callback handler
- `GET /status` - Check connection status
- `DELETE /disconnect` - Revoke connection

### Agent (`/agent`)
- `POST /chat` - Send message to AI agent
- `GET /conversations` - List user's conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/{id}` - Get conversation details
- `GET /conversations/{id}/messages` - Get messages (paginated)
- `PATCH /conversations/{id}` - Update conversation title
- `DELETE /conversations/{id}` - Delete conversation

### Preferences (`/preferences`)
- `GET /` - Get user preferences
- `PUT /` - Update preferences (working hours, timezone, calendar filtering)

### Users (`/users`)
- `PATCH /profile` - Update profile (name, email)
- `POST /avatar` - Upload avatar image

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Purpose | How to Get |
|----------|---------|------------|
| `DATABASE_URL` | Main Postgres connection | `postgresql+asyncpg://user:pass@host/schedly` |
| `LANGGRAPH_DB_URL` | LangGraph checkpoints DB | `postgresql://user:pass@host/schedly_langgraph` |
| `SECRET_KEY` | JWT signing key | `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` | OAuth client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | Same as above |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost:8000/google-calendar/callback` |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Fernet encryption key | `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `OPENROUTER_API_KEY` | LLM API access | [OpenRouter Keys](https://openrouter.ai/keys) |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` (required for OAuth state) |

### Optional Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `FRONTEND_URL` | `http://localhost:3000` | CORS configuration |
| `OPENROUTER_MODEL` | `nvidia/nemotron-3-super-120b-a12b:free` | LLM model selection |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `DEBUG` | `False` | Development mode |
| `LOG_LEVEL` | `INFO` | Logging verbosity |

See `.env.example` for complete configuration template.

### Model Selection

| Model | Cost | Use Case |
|-------|------|----------|
| `nvidia/nemotron-3-super-120b-a12b:free` | Free | Development/MVP |
| `anthropic/claude-3.5-sonnet` | $3/M tokens | Production (best tool accuracy) |
| `openai/gpt-4o-mini` | $0.15/M tokens | High-volume, simple queries |

**Recommendation**: Start with Nemotron for prototyping, then migrate to Claude 3.5 Sonnet for production (superior calendar tool orchestration).

## Running Locally

### Prerequisites
- Python 3.11+
- PostgreSQL 14+ (two databases required)
- Redis 6+ (required for OAuth CSRF protection)

### Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section)

# 5. Create databases
createdb schedly
createdb schedly_langgraph

# 6. Run migrations
alembic upgrade head

# 7. Start server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs (auto-generated Swagger UI)

## Testing the Agent

**Example conversation flow:**

```
User: "Am I free tomorrow at 2pm?"
Agent: [calls check_free tool]
Response: "You have a meeting at 2pm tomorrow with John (Team Standup)"

User: "Find me a 30-minute slot this week for coffee"
Agent: [calls find_slots tool with duration_minutes=30]
Response: "I found 3 slots: Tuesday 10:30am, Wednesday 2pm, Friday 3pm"

User: "Book Tuesday with alice@example.com"
Agent: [calls create_event tool]
Response: "Done! I've sent Alice a calendar invite for Tuesday 10:30am"
```

**Agent Decision Process:**
1. Parses natural language for temporal expressions ("tomorrow", "this week")
2. Decides which tools to call based on intent
3. Respects user preferences (timezone, working hours)
4. Handles multi-step operations (find slots then create event)

## Dependencies

### Core Framework
- `fastapi==0.142.2` - Async web framework
- `uvicorn==0.54.0` - ASGI server
- `sqlmodel==0.0.48` - SQLAlchemy + Pydantic
- `asyncpg==0.32.0` - High-performance Postgres driver
- `alembic==1.20.0` - Database migrations

### AI/LLM Stack
- `langchain==1.4.3` - LLM orchestration
- `langgraph==1.2.14` - Stateful agent graphs
- `langgraph-checkpoint-postgres==3.1.3` - Persistent checkpointing
- `langchain-openai==1.7.0` - OpenRouter integration

### Security
- `python-jose==3.5.0` - JWT encoding/decoding
- `passlib==1.7.4` - Argon2 password hashing
- `argon2-cffi==25.1.0` - Argon2 implementation
- `cryptography==50.0.2` - Fernet token encryption

### Google APIs
- `google-api-python-client==2.201.0` - Calendar API client
- `google-auth==2.60.0` - OAuth 2.0
- `google-auth-oauthlib==1.5.0` - OAuth helpers

### Production
- `redis==8.1.0` - Caching layer
- `pydantic-settings==2.15.0` - Environment config
- `python-dotenv==1.2.4` - .env file loading

---

**Built with FastAPI, LangGraph, and Google Calendar APIs**

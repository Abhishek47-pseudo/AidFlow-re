# API Routes Documentation

This document provides a comprehensive reference of all API endpoints exposed by the AidFlow backend server, organized by their respective modules.

---

## 🔐 Global Middlewares & Authentication

Most routes are protected by authentication and Role-Based Access Control (RBAC) middlewares defined in [auth.js](file:///d:/AidFlow/backend/middleware/auth.js):
- **`protect`**: Verifies the `Authorization: Bearer <token>` header contains a valid JWT.
- **`authorize(...roles)`**: Restricts access to specific user roles (`admin`, `branch manager`, `volunteer`, `affected citizen`).

---

## 1. Authentication Routes

**File Location:** [server.js](file:///d:/AidFlow/backend/server.js)  
**Base Path:** `/api`

### `POST /api/register`
* **Authentication:** None (Public)
* **RBAC Allowed Roles:** Automatically registers public roles `volunteer` or `refugee` (affected citizen). Restricted roles `admin` and `branch manager` cannot be registered through this public endpoint.
* **Request Body:**
  ```json
  {
    "username": "example@domain.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe",
    "country": "India",
    "state": "Punjab",
    "city": "Chandigarh",
    "address": "123 Main St, Chandigarh",
    "companyType": "Individual",
    "occupation": "Volunteer Coordinator",
    "volunteerSkills": ["first_aid", "driving"],
    "role": "volunteer"
  }
  ```
* **Response:** Returns registered user details and a signed JWT token.

### `POST /api/login`
* **Authentication:** None (Public)
* **Request Body:**
  ```json
  {
    "username": "example@domain.com",
    "password": "SecurePassword123"
  }
  ```
* **Response:** Returns user information, role, and a signed JWT token.

---

## 2. Emergency Routes

**File Location:** [emergency.js](file:///d:/AidFlow/backend/routes/emergency.js)  
**Base Path:** `/api/emergency`  
**Authentication:** Required (`protect` middleware applies to all routes except where noted)

### Core Emergency Reporting & AI Processing
#### `POST /api/emergency/request`
* **Authentication:** Required (User ID resolved from JWT token or fallback request body)
* **Purpose:** Submit an emergency report. Triggers **Agent 1 (EmergencyAIAgent)** for disaster/sentiment analysis, and **EmergencyDecisionAgent** for autonomous dispatch planning. High-severity reports trigger automatic resource reservation and dispatch.
* **Request Body:**
  ```json
  {
    "lat": 30.7333,
    "lon": 76.7794,
    "message": "Heavy flooding has trapped 5 families in their homes near the river bank.",
    "address": "Sukhna Lake Area, Chandigarh"
  }
  ```

#### `POST /api/emergency/request-with-image`
* **Purpose:** Submit an emergency report containing a base64 image. Triggers **Agent 2 (ImageDisasterDetectionAgent)** (combining EfficientNet image classification and NASA FIRMS satellite data verification) followed by the Decision Agent.
* **Request Body:**
  ```json
  {
    "imageData": "data:image/jpeg;base64,...",
    "location": {
      "lat": 30.7333,
      "lon": 76.7794,
      "address": "Sukhna Lake Area"
    },
    "message": "Water levels rising quickly."
  }
  ```

#### `POST /api/emergency/analyze-image`
* **Purpose:** Perform image analysis only (Agent 2) without saving an emergency request or triggering dispatch actions.

#### `POST /api/emergency/public-request`
* **Authentication:** None (Public endpoint for testing/unauthenticated reports)
* **Request Body:** Same as `/api/emergency/request`
* **Response:** Processed emergency request details.

---

### Emergency Dispatch & Route Optimization
#### `POST /api/emergency/dispatch/:emergencyId`
* **Authentication:** Required
* **RBAC Allowed Roles:** `admin` (Requires explicit `adminId` in request body)
* **Purpose:** Executed by admins for one-click manual dispatch. Reserves inventory items, calculates optimal route, and dispatches responders.

#### `POST /api/emergency/reroute/:emergencyId`
* **Purpose:** Request route update for a dispatch en-route. Uses **Agent 3 (SmartRoutingAgent)** to calculate a new route based on real-time traffic and hazard blocks.
* **Request Body:**
  ```json
  {
    "currentLocation": { "lat": 30.725, "lon": 76.782 }
  }
  ```

#### `POST /api/emergency/ai-decision/:emergencyId`
* **Purpose:** Manually trigger the AI decision agent to re-evaluate and suggest a dispatch plan for an existing emergency request.

#### `GET /api/emergency/ai-capabilities`
* **Purpose:** Returns the current operational status of the Groq/Ollama LLM connection, model names, and decision criteria.

#### `GET /api/emergency/status/:emergencyId`
* **Purpose:** Fetch detailed status, timeline entries, assigned response team, and AI analysis for a specific emergency.

#### `GET /api/emergency/active`
* **Purpose:** List all emergencies with statuses `received`, `analyzing`, `dispatched`, or `en_route` sorted by severity.

#### `PUT /api/emergency/update/:emergencyId`
* **Purpose:** Update status, notes, or assign a responder team to an emergency. Adds to the timeline logs.

#### `GET /api/emergency/analytics`
* **Purpose:** Aggregates statistics of emergencies grouped by status, severity, disaster type, and counts recent emergencies.

---

### Dispatch Request Board (Manual Review Queue)
#### `GET /api/emergency/dispatch-requests`
* **Purpose:** List all pending dispatch requests awaiting admin approval (for low/medium severity emergencies).

#### `PUT /api/emergency/dispatch-requests/:id/approve`
* **Purpose:** Approve a dispatch request. Triggers dispatch execution and resource deployment.
* **Request Body:** `{ "adminId": "admin-mongo-id", "notes": "Approved" }`

#### `PUT /api/emergency/dispatch-requests/:id/reject`
* **Purpose:** Reject a dispatch request and log the rejection reason.

---

### Responder Tracking & Completion
#### `GET /api/emergency/dispatch-status/:emergencyId`
* **Purpose:** Get tracking details, distance, ETA, and routing waypoints for active dispatches.

#### `PUT /api/emergency/update-status/:emergencyId`
* **Purpose:** Update tracking status (e.g. to `en_route`, `arrived`, etc.).

#### `GET /api/emergency/active-dispatches`
* **Purpose:** Returns all active dispatches (`dispatched`, `en_route`, `delivered`) and recently completed dispatches.

#### `PUT /api/emergency/complete/:emergencyId`
* **Purpose:** Mark an emergency dispatch as `completed`, recording delivery notes and arrival timestamps.

#### `GET /api/emergency/completed`
* **Purpose:** Get a list of the 50 most recently completed emergencies.

#### `DELETE /api/emergency/:emergencyId`
* **Purpose:** Permanently delete an emergency record (Allowed only if status is `completed` or `cancelled`).

---

## 3. Disaster Routes

**File Location:** [disasters.js](file:///d:/AidFlow/backend/routes/disasters.js)  
**Base Path:** `/api/disasters`  
**Authentication:** Optional / None (for public tracking dashboards)

### Live Feeds (External Integrations)
#### `GET /api/disasters/test`
* **Purpose:** Health check route for disaster endpoints.

#### `GET /api/disasters/live`
* **Purpose:** Combined feed of live natural disasters (USGS earthquakes + NASA EONET events). Filters by `minMagnitude` and `days`.

#### `GET /api/disasters/live/earthquakes`
* **Purpose:** Live earthquakes feed directly from USGS API.

#### `GET /api/disasters/live/events`
* **Purpose:** Live hazard events (fires, storms, volcanoes) from NASA EONET.

#### `POST /api/disasters/live/import/:id`
* **Purpose:** Import a disaster from live external feeds into AidFlow's local DB as an active `DisasterZone`.

### Local Disaster Zones
#### `GET /api/disasters/zones`
* **Purpose:** Get all registered disaster zones (Filterable by `status`, `type`, `severity`).

#### `POST /api/disasters/zones`
* **Purpose:** Manually create a new disaster zone.

#### `DELETE /api/disasters/zones/:zoneId`
* **Purpose:** Mark a disaster zone as `resolved` (soft delete). Updates metadata with resolution notes.

#### `GET /api/disasters/analytics`
* **Purpose:** Summarizes counts of active, resolved, total, and recent disaster zones, plus estimated affected populations.

---

## 4. Inventory, Donations & Requests Routes

**File Location:** [inventory.js](file:///d:/AidFlow/backend/routes/inventory.js) and [server.js](file:///d:/AidFlow/backend/server.js)  
**Base Paths:** Mounted under both `/api/inventory` (standard CRUD) and `/api` (for donations/requests compatibility)

### Inventory Items CRUD
#### `GET /api/inventory/items` or `GET /api/items`
* **Authentication:** Required (when accessed via `/api/inventory/items` in `server.js`)
* **Purpose:** List inventory items, filterable by `category`, `location`, and `status`.

#### `POST /api/inventory/items` or `POST /api/items`
* **Purpose:** Add a new item to inventory.

#### `PUT /api/inventory/items/:id` or `PUT /api/items/:id`
* **Purpose:** Update details, cost, or stock quantities of an item.

#### `DELETE /api/inventory/items/:id` or `DELETE /api/items/:id`
* **Purpose:** Remove an item from the inventory registry.

### Inventory Locations & Transactions
#### `GET /api/inventory/locations` or `GET /api/locations`
* **Purpose:** List all storage hubs/inventory locations.

#### `POST /api/inventory/locations` or `POST /api/locations`
* **Purpose:** Add a new inventory hub location.

#### `GET /api/inventory/transactions` or `GET /api/transactions`
* **Purpose:** List transaction history log (Filterable by `type` and `status`).

#### `POST /api/inventory/transactions` or `POST /api/transactions`
* **Purpose:** Log a manual inventory transaction.

---

### Donations (Volunteer Flows)
#### `GET /api/donations` or `GET /api/inventory/donations`
* **Purpose:** Get a list of donations (Filterable by `status` and `volunteerId`).

#### `POST /api/donations` or `POST /api/inventory/donations`
* **Purpose:** Submit a new donation request.

#### `POST /api/volunteer/donate`
* **Authentication:** Required
* **RBAC Allowed Roles:** `volunteer`, `admin`
* **Purpose:** Submit a donation associated directly with the logged-in user.

#### `GET /api/volunteer/donations`
* **Authentication:** Required
* **RBAC Allowed Roles:** `volunteer`, `admin`
* **Purpose:** Get all donations submitted by the logged-in volunteer.

#### `PUT /api/donations/:id` or `PUT /api/admin/donation/:id`
* **Authentication:** Required (via admin endpoint)
* **RBAC Allowed Roles:** `admin`, `branch manager`
* **Purpose:** Approve or reject a donation. Approving the donation automatically increases the corresponding stock in the `InventoryItem` model.

---

### Item Requests (Affected Citizen Flows)
#### `GET /api/requests` or `GET /api/inventory/requests`
* **Purpose:** Get a list of item requests (Filterable by `status` and `requesterId`).

#### `POST /api/requests` or `POST /api/inventory/requests`
* **Purpose:** Submit a resource request.

#### `POST /api/requester/request`
* **Authentication:** Required
* **RBAC Allowed Roles:** `affected citizen`, `admin`
* **Purpose:** Submit an item request linked to the logged-in citizen.

#### `GET /api/requester/requests`
* **Authentication:** Required
* **RBAC Allowed Roles:** `affected citizen`, `admin`
* **Purpose:** Get all requests submitted by the logged-in citizen.

#### `PUT /api/requester/fulfill/:id`
* **Authentication:** Required
* **RBAC Allowed Roles:** `affected citizen`
* **Purpose:** Allows a citizen to mark their own request as `fulfilled`.

#### `GET /api/admin/requests`
* **Authentication:** Required
* **RBAC Allowed Roles:** `admin`, `branch manager`
* **Purpose:** Get all submitted item requests (populated with requester details) for the admin dashboard.

#### `PUT /api/requests/:id` or `PUT /api/admin/request/:id`
* **Authentication:** Required
* **RBAC Allowed Roles:** `admin`, `branch manager`, `affected citizen`
* **Purpose:** Approve, deliver, or update the status of a request. Approving or delivering the request automatically deducts the requested quantities from the `InventoryItem` stock.

#### `DELETE /api/admin/request/:id`
* **Authentication:** Required
* **RBAC Allowed Roles:** `admin`
* **Purpose:** Permanently delete a request from the queue.

---

## 5. Agent Output & Severity Tracking Routes

**File Location:** [agents.js](file:///d:/AidFlow/backend/routes/agents.js)  
**Base Path:** `/api/agents`  
**Authentication:** Required (`protect` middleware applies to all routes)

Provides full CRUD operations and statistics for logging AI outputs.

### Agent Severity Logs CRUD
- `POST /api/agents/severity-logs` - Log a new AI severity analysis
- `GET /api/agents/severity-logs` - Get all severity logs (Filterable by `agentType`, `severity`, `disasterType`, `status`)
- `GET /api/agents/severity-logs/:logId` - Get a specific severity log
- `PUT /api/agents/severity-logs/:logId` - Update log contents
- `DELETE /api/agents/severity-logs/:logId` - Delete log entry

### Disaster Zones Sync CRUD
- `POST /api/agents/disaster-zones` - Add a disaster zone record
- `GET /api/agents/disaster-zones` - Get disaster zones tracked by AI
- `GET /api/agents/disaster-zones/:zoneId` - Get single zone
- `PUT /api/agents/disaster-zones/:zoneId` - Update zone details
- `DELETE /api/agents/disaster-zones/:zoneId` - Delete zone entry

### Agent Routing History CRUD
- `POST /api/agents/routing-history` - Log route calculations
- `GET /api/agents/routing-history` - Get calculated routes log (Filter by `status`, `severity`, `emergencyId`)
- `GET /api/agents/routing-history/:routeId` - Get specific route path details
- `PUT /api/agents/routing-history/:routeId` - Update route log
- `DELETE /api/agents/routing-history/:routeId` - Delete route log entry

### AI Agent Raw Outputs CRUD
- `POST /api/agents/agent-outputs` - Store raw LLM or classifier outputs
- `GET /api/agents/agent-outputs` - Get raw outputs (Filter by `agentId`, `status`, `emergencyId`)
- `GET /api/agents/agent-outputs/:outputId` - Fetch specific agent output
- `PUT /api/agents/agent-outputs/:outputId` - Update output entry
- `DELETE /api/agents/agent-outputs/:outputId` - Delete output entry

### Analytics & AI Tools
- `GET /api/agents/analytics/severity-stats` - Aggregate average severity scores and confidence levels grouped by agent type.
- `GET /api/agents/analytics/zone-stats` - Aggregated zone counts and affected populations by type, severity, and status.
- `GET /api/agents/analytics/routing-stats` - Average distances and durations of dispatched routes by status/severity.
- `POST /api/agents/calculate-route` - Request route calculation with origin, destination, and options. Returns distance, duration, and GeoJSON waypoints.

---

## 6. Disaster Predictions Routes

**File Location:** [server.js](file:///d:/AidFlow/backend/server.js)  
**Base Path:** `/api`

### `GET /api/disaster-predictions`
* **Authentication:** None (Public)
* **Purpose:** Reads satellite disaster prediction metadata from `data/predictions_with_coords.csv` and returns predicted disaster locations filterable by probability thresholds. Used directly by the frontend mapping components.

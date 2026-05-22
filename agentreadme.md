# Mahir AI Agents & Job Post Lifecycle

This document provides a detailed overview of how the AI agents in Mahir work, specifically focusing on the creation and deletion lifecycle of a Job Post.

## 🧠 The Agent Pipeline

Mahir uses an **Agentic Orchestrator** pattern (`MahirOrchestrator`) that handles client requests by chaining multiple specialized LLM-powered agents. The main agents involved in processing a request are:

### 1. Parser Agent
**Role: Intent Extraction & Translation**
The Parser Agent acts as the "receptionist" of the marketplace. It takes messy, unstructured, and often multilingual client input (e.g., voice notes or text in Urdu, Roman Urdu, or English) and structures it into a machine-readable format.
*   **Key Responsibilities:**
    *   Translating input and generating the job post in English, Urdu script, and Roman Urdu.
    *   Extracting the specific `serviceType` (e.g., mapping "pani ka pipe masla" to "Plumber").
    *   Identifying the client's `urgency` level and `budgetSensitivity` using emotional language analysis.
    *   Extracting the `location` (city and area) and `preferredTime`.
    *   Deciding if a clarification question is needed (if confidence is below 70%).

### 2. Matchmaker Agent
**Role: Provider Scoring & Ranking**
The Matchmaker Agent is responsible for finding the absolute best service providers for a specific job post. It receives the client's intent from the Parser and a list of nearby providers from the database, then ranks them.
*   **Key Responsibilities:**
    *   Calculating a composite 0-100 score for each provider using a strict mathematical formula.
    *   Weighing 6 distinct factors: Distance (25%), Rating (20%), On-Time Score (20%), Specialization (15%), Cancellation Rate (10%), and Review Sentiment (10%).
    *   Filtering out unreliable providers (e.g., anyone with a cancellation rate > 40%).
    *   Providing human-readable reasoning for why specific providers were matched.
    *   Handling fallbacks (e.g., if no providers are found, suggesting the user try again later).

### 3. Quoter Agent
**Role: Pricing & Dispatch Management**
The Quoter Agent handles the financial and scheduling logistics once a client selects a provider. It ensures fair pricing and clear communication.
*   **Key Responsibilities:**
    *   Calculating a transparent price estimate (PKR) including base fees, distance charges, urgency surges, and peak-hour pricing.
    *   Determining the best booking slot based on the job's urgency (e.g., suggesting a slot within 2 hours for high-urgency jobs).
    *   Generating bilingual confirmation messages (simulated SMS) tailored separately for the client and the provider (ensuring privacy).
    *   Setting up a follow-up schedule (reminders, check-ins, and feedback requests).

---

## 🛠️ How a Job Post is Created

When a client submits a new service request (e.g., via natural language text or audio), the Orchestrator executes a multi-step pipeline to create a matching Job Post:

### Step 1: Parser Agent Analysis
The orchestrator first passes the client's raw message to the **Parser Agent**. 
- The Parser translates the input and generates descriptions in three formats (English, Urdu script, and Roman Urdu) for accessibility.
- It extracts the `serviceType`, location coordinates, urgency level, and budget expectations.

### Step 2: Geo-Spatial Querying
Using the extracted intent from the Parser, the backend runs a **MongoDB `$geoNear` aggregation** to find active service providers within a 10km radius (falling back to 25km if fewer than 3 are found).

### Step 3: Matchmaker Agent Scoring
The list of nearby providers is sent to the **Matchmaker Agent**.
- The Matchmaker calculates an AI-driven suitability score for each provider.
- Scoring factors include distance, provider rating, on-time score, cancellation rate, and specialization match.
- It returns a ranked list of the best matches.

### Step 4: Job Post Creation
The orchestrator takes the parsed details and the top matched providers, and inserts a new **Job Post** document into the MongoDB database. 
- The new Job Post has its status set to `open`.
- It includes the trilingual descriptions, intent data, client coordinates, and an array of `matchedProviderIds`.
- A trace of the entire agent pipeline reasoning is saved to `AgentLog` for auditing.

*Once saved in the database, the Job Post appears on the provider portal/job feed for the matched providers.*

---

## 🗑️ How a Job Post is Deleted

To keep the marketplace efficient and the Job Portal clean, Mahir implements an automated lifecycle management system for Job Posts.

### Automated Deletion (TTL Index)
Job posts are **not manually deleted by agents**. Instead, Mahir leverages a **MongoDB TTL (Time-To-Live) index** for automatic garbage collection:

1. **Expiration Time Setup:** When the `JobPost` document is created in Step 4, it is automatically assigned an `expiresAt` timestamp, which defaults to **24 hours** from creation.
2. **Database Pruning:** The `JobPost` schema defines a TTL index on the `expiresAt` field:
   ```typescript
   JobPostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
   ```
3. **Automated Removal:** When the current time passes the `expiresAt` timestamp, MongoDB's background thread automatically deletes the document from the database. This ensures that unanswered or stale job requests do not clutter the provider's job feed.

### Status-Based Updates (Cancellation)
While hard-deletion happens automatically after 24 hours, job posts can also be logically removed from the open portal when:
- A client cancels the request (status is updated to `cancelled`).
- A provider accepts the job and the **Quoter Agent** creates a Booking (status is updated to `matched` or `accepted`). 

Once the status is no longer `open`, the job post is filtered out of the active job feed.

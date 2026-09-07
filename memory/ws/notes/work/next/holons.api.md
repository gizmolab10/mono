# Holons API Specification (TypeScript-Oriented)

**Base URL**: `https://api.map-holons.org/v1`  
**Authentication**: Bearer Token (`Authorization: Bearer <token>`)

---

## 🧱 Resource Interface

```ts
interface Holon {
  id: string;               // UUID
  title: string;
  description: string;
  tags: string[];
  createdAt: string;        // ISO 8601 datetime
  updatedAt: string;        // ISO 8601 datetime
  ownerId: string;
}
🔹 Endpoints

1. Create a Holon
POST /holons

Request Body

Always show details

type CreateHolonRequest = Omit<Holon, 'id' | 'createdAt' | 'updatedAt'>;
Response

Always show details

type CreateHolonResponse = {
  success: true;
  data: Holon;
};
2. List Holons
GET /holons

Query Parameters

Always show details

interface ListHolonsQuery {
  tag?: string;
  ownerId?: string;
  limit?: number;
  offset?: number;
}
Response

Always show details

type ListHolonsResponse = {
  success: true;
  data: Holon[];
};
3. Get a Single Holon
GET /holons/{id}

Response

Always show details

type GetHolonResponse = {
  success: true;
  data: Holon;
};
4. Update a Holon
PUT /holons/{id}

Request Body

Always show details

type UpdateHolonRequest = Omit<Holon, 'id' | 'createdAt' | 'updatedAt'>;
Response

Always show details

type UpdateHolonResponse = {
  success: true;
  data: Holon;
};
5. Delete a Holon
DELETE /holons/{id}

Response

Always show details

type DeleteHolonResponse = {
  success: true;
  message: string;
};
⚠️ Standard Error Format
Always show details

type ErrorResponse = {
  error: string;
  message: string;
};
"""

Save to a new file

file_path_ts = Path("/mnt/data/fiddle.spec")
file_path_ts.write_text(ts_spec_content)

file_path_ts.name

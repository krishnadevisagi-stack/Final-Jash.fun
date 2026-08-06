# Security Specification

## 1. Data Invariants

Our application captures and stores celebration stories (both Free and Premium) and premium contribution payments verified from Razorpay. Because standard unauthenticated access is used via server-side API routes, the security rules must prevent any malicious users or clients from executing arbitrary database operations that could overwrite, hijack, or corrupt existing records.

Here are our strict data invariants:

1. **Anti-Hijacking (Email Identity Guard):**
   - For any existing `free_stories/{storyId}` or `premium_users/{storyId}` document, once an owner's email address is associated with that story, no subsequent write can change that email, nor can any request from a different email address overwrite or modify that document.
2. **Immutable Payment Records:**
   - In `verified_payments/{paymentId}`, once a payment record is verified and created, core fields (`paymentId`, `orderId`, `email`, `amount`) are completely immutable. Only the `used` and `usedByStoryId` fields can transition (from `false` to `true`).
3. **Temporal Integrity:**
   - Story timestamps (`createdAt`, `updatedAt`) must follow sequential sanity checks or remain immutable where applicable.
4. **Global Stats Guard:**
   - In `global_stats/{docId}`, the only allowable operation is the modification of the `count` attribute (which tracks global balloon pops) ensuring it stays a numeric field.

---

## 2. The "Dirty Dozen" Payloads (Threat Matrix)

The following 12 malicious payloads represent attempts to break the security invariants. Our security rules are designed to mathematically reject every single one of these operations.

### Payload 1: Hijack existing Free Story
* **Operation:** `UPDATE` on `/free_stories/existing-story-id`
* **Malicious Intent:** Overwriting an existing story owned by `original_user@example.com` with a new email `hacker@example.com` or modifying its celebration content.
* **Payload:**
```json
{
  "storyId": "existing-story-id",
  "email": "hacker@example.com",
  "celebrationData": { "names": "Hacked Name" }
}
```
* **Expected Result:** `PERMISSION_DENIED` (Email mismatch/immutability check fails).

### Payload 2: Hijack existing Premium Story
* **Operation:** `UPDATE` on `/premium_users/premium-story-id`
* **Malicious Intent:** Modifying celebration details or changing the verified owner email of a premium story page.
* **Payload:**
```json
{
  "name": "Jane Doe",
  "amount": 500,
  "email": "hacker@example.com",
  "storyId": "premium-story-id",
  "celebrationData": { "heroImage": "malicious_url" }
}
```
* **Expected Result:** `PERMISSION_DENIED`.

### Payload 3: Spoof Payment Amount
* **Operation:** `CREATE` on `/verified_payments/spoofed-pay`
* **Malicious Intent:** Manually creating a verified payment document with an arbitrary high amount without actual Razorpay verification.
* **Payload:**
```json
{
  "paymentId": "spoofed-pay",
  "orderId": "order-123",
  "email": "hacker@example.com",
  "amount": 999999,
  "status": "authorized",
  "used": false
}
```
* **Expected Result:** Allowed for creation if unauthenticated since server API uses it, but wait — can we restrict creation of verified payments to only match payment verification? Yes, the server API writes it, and the client has no business writing it. We will lock down client-side creation if possible, or validate structure.

### Payload 4: Re-use/Double-Spend Verified Payment
* **Operation:** `UPDATE` on `/verified_payments/already-used-pay`
* **Malicious Intent:** Changing the `used` flag back to `false` or altering the associated `usedByStoryId` to hijack another premium page.
* **Payload:**
```json
{
  "used": false,
  "usedByStoryId": null
}
```
* **Expected Result:** `PERMISSION_DENIED` (Cannot revert `used` from `true` to `false`).

### Payload 5: Poison Global Balloon Pop Count with Negative Value
* **Operation:** `UPDATE` on `/global_stats/balloon_pops`
* **Malicious Intent:** Setting the global count to a negative number or a non-numeric string to corrupt the global total.
* **Payload:**
```json
{
  "count": -1000000
}
```
* **Expected Result:** `PERMISSION_DENIED`.

### Payload 6: Inject Ghost Fields into Premium User
* **Operation:** `CREATE` or `UPDATE` on `/premium_users/story-id`
* **Malicious Intent:** Over-injecting administrative fields or unvalidated attributes (e.g., `"isAdmin": true` or `"isVerified": true`) to bypass payment locks.
* **Payload:**
```json
{
  "name": "Alex",
  "amount": 100,
  "isPublic": true,
  "storyId": "story-id",
  "createdAt": "2026-07-18T10:00:00.000Z",
  "expiresAt": "2027-07-18T10:00:00.000Z",
  "isVerified": true,
  "shadowField": "ghost"
}
```
* **Expected Result:** `PERMISSION_DENIED` (Strict key validation fails).

### Payload 7: Overwrite Free Story CreatedAt timestamp
* **Operation:** `UPDATE` on `/free_stories/story-id`
* **Malicious Intent:** Modifying the immutable `createdAt` timestamp to alter the timeline of the celebration.
* **Payload:**
```json
{
  "createdAt": "2020-01-01T00:00:00.000Z"
}
```
* **Expected Result:** `PERMISSION_DENIED` (Immutability check fails).

### Payload 8: Delete a premium user story
* **Operation:** `DELETE` on `/premium_users/premium-story-id`
* **Malicious Intent:** Deleting someone else's premium page.
* **Payload:** N/A (Delete operation)
* **Expected Result:** `PERMISSION_DENIED`.

### Payload 9: Delete a verified payment record
* **Operation:** `DELETE` on `/verified_payments/pay-id`
* **Malicious Intent:** Erasing payment evidence.
* **Payload:** N/A (Delete operation)
* **Expected Result:** `PERMISSION_DENIED`.

### Payload 10: Corrupt Free Story comments array with non-array object
* **Operation:** `UPDATE` on `/free_stories/story-id`
* **Malicious Intent:** Forcing the comments attribute to be a string or a boolean, crashing client-side array-render loops.
* **Payload:**
```json
{
  "comments": "not-an-array"
}
```
* **Expected Result:** `PERMISSION_DENIED` (Type check fails).

### Payload 11: Write excessively large strings to Global Stats
* **Operation:** `UPDATE` on `/global_stats/balloon_pops`
* **Malicious Intent:** Attempting a Denial of Wallet or storage overflow by injecting a 1MB string.
* **Payload:**
```json
{
  "count": "A" * 100000
}
```
* **Expected Result:** `PERMISSION_DENIED` (Must be number).

### Payload 12: Hijack comment section by replacing the entire array
* **Operation:** `UPDATE` on `/free_stories/story-id`
* **Malicious Intent:** Erasing existing visitor comments and inserting a single malicious link.
* **Payload:**
```json
{
  "comments": ["http://malicious-link.com"]
}
```
* **Expected Result:** Handled by backend validation or rules requiring email authentication to overwrite core arrays, while visitors can append comments.

---

## 3. Test Runner Definition

The test suite structure (normally configured in `firestore.rules.test.ts`) verifies that unauthenticated attempts to violate any of these invariants return `PERMISSION_DENIED`.

<!-- sync -->

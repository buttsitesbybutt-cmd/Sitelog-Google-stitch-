# Security Specification - Al-injaz Management MEP

## Data Invariants
1. A Project must belong to the user who created it.
2. A DailyLog must belong to a project that the user owns.
3. A Category must belong to the user who created it.
4. Duplicate prevention for Projects: (villaNum + plotNum + categoryId) must be unique for a user. (Note: Firestore rules can't strictly enforce global uniqueness across docs easily without a specific path, but we can structure the ID or check in code. For rules, we ensure ownership).
5. Only the owner can read/write their own data.

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a Project with a `userId` that isn't the logged-in user.
2. **Orphaned Log**: Attempt to create a DailyLog for a `projectId` that doesn't exist or belongs to another user.
3. **Ghost Update**: Attempt to update a Project's `userId` after creation.
4. **Malicious Progress**: Attempt to set `progress` to -1 or 101.
5. **Junk ID**: Using a 1MB string as a document ID.
6. **PiI Leak**: Attempting to list all Categories without being the owner.
7. **Bypassing Category Ownership**: Updating a Category's `name` when not the owner.
8. **Invalid Enum**: Setting Project `status` to "GhostStatus".
9. **Timestamp Tampering**: Providing a client-side `lastUpdated` timestamp that doesn't match `request.time`.
10. **Unauthorized Log Listing**: Attempting to read logs of a project owned by someone else.
11. **Bulk Creation**: Attempting to create 1000 projects in one batch (size limits).
12. **Template Theft**: Reading another user's saved ReportTemplate.

## Test Runner (Logic Check)
The rules will enforce:
- `request.auth != null`
- `resource.data.userId == request.auth.uid` or `get(/path/to/parent).data.userId == request.auth.uid`
- `isValidId()` for all document IDs.
- Schema validation for all fields.

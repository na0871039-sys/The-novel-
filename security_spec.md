# Security Specification for MyNovel Library

## 1. Data Invariants
- A `Chapter` must be associated with a valid `Novel`.
- A `Bookmark` must reference a valid `Novel`.
- `ReadingProgress` must reference a valid `Novel`.
- Only the user with email `na0871039@gmail.com` (or a user with `isAdmin: true` in Firestore) can perform write operations on `novels` and `chapters`.

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. **Unauthenticated Write**: Creating a novel without being logged in.
2. **User as Admin**: A regular user trying to create a novel.
3. **Spoofed Admin ID**: A user trying to set `isAdmin: true` on their own profile during creation.
4. **Invalid Chapter ID**: Injecting a 1MB string as a `chapterId`.
5. **Orphaned Chapter**: Creating a chapter for a non-existent novel.
6. **Relational Theft**: A user trying to read another user's bookmarks list.
7. **Cross-User Progress Write**: User A trying to update the reading progress of User B.
8. **Shadow Field Injection**: Adding `isVerified: true` to a novel metadata object.
9. **Timestamp Spoofing**: Sending a client-side `createdAt` date into the past.
10. **Modification of Immutable Fields**: Changing the `novelId` of a chapter after it's been created.
11. **Excessive String Length**: Title of a novel being 10,000 characters long.
12. **Malicious Query**: Trying to list all bookmarks from all users using a collectionGroup query (if not explicitly allowed).

## 3. Test Cases (Summary)
- `PERMISSION_DENIED` for all "Dirty Dozen" payloads.
- `PERMISSION_OK` for admin creating a novel.
- `PERMISSION_OK` for users reading novels.
- `PERMISSION_OK` for users managing their own bookmarks.

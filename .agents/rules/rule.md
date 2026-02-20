---
trigger: always_on
---

Single-file scripts must not exceed 400 lines of code.
If a script approaches this limit, refactor by decomposing logic into smaller, well-scoped functions or by extracting supporting modules/scripts as appropriate.
Under no circumstances should a single script grow into a monolithic file (e.g., 300–600+ lines). Maintain modularity, readability, and separation of concerns at all times.
# Collaboration workflow

The public baseline root commit is the only direct push to `main`.

1. Claim an approved GitHub Issue.
2. Create `issue/<number>-<short-slug>` from `main`.
3. Run the documented checks and include evidence in the pull request.
4. Wait for the repository owner's approval before merging.
5. Never commit credentials, customer content, private keys or account exports.

The `main` ruleset enforces the pull-request, review and CI gates. Contributions
submitted for inclusion are licensed under Apache-2.0 unless explicitly marked
otherwise before submission.

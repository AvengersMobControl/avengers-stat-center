# Owner roster editor

Open the Rosters tab of the Discord-signed-in Stat Center at
https://avengers-stat-center.vercel.app/?page=rosters. The Manage rosters link
is injected only when the server verifies the session belongs to the single
configured owner. The editor supports AVENGERS, AV-2, and Inactive status,
new canonical members, and explicit aliases or existing-profile links.

Saves are stored in the private Neon identity schema with a revision and a
retry ID. The GitHub roster workflow validates the canonical build, commits
the owner-approved operations, and requests the normal GitHub Pages release.
The form displays the number of saved changes pending publication. The
results importer consumes the same versioned member catalog and aliases
from the canonical release. Current status and event-time clan stay separate.
Linking names with conflicting scores on the same event is blocked until the
source results are resolved. Original source spellings and timestamps are
retained with event evidence.

The editor uses the existing single Discord owner allowlist. The GitHub
worker can read queued operations only with a short-lived OIDC token for the
exact main-branch roster workflow. The worker receives no Discord user IDs.
Apply database/migrations/007_roster_editor.sql to the existing private
AVENGERS database before enabling writes. Reuse the existing restricted
identity runtime connection. Use the GitHub Actions run and the immutable
Pages release manifest to diagnose a pending deployment.

Use connected services only for ChatGPT/Codex work on this project.

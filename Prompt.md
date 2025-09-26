# Task 1: Sokoban Game Prompts
## Prompts
**Player Movement**
I need help implementing the movement logic for my Sokoban game.
The player should move using arrow keys but not pass through walls or push boxes incorrectly.
They can only push one box at a time and cannot pull at all.
# Task 2: Leaderboard and Puzzle Management Prompts
## Prompts
1. **Server Error**
The console shows a "500 Internal Server Error" when accessing /leaderboard.
What could be causing this error, and how can I fix it?
2. **Database Schema Error**
The console reports: "no such column: s.user_id".
How can I resolve database schema mismatches that are causing this issue?
3. **Puzzle Creation**
When I press "Create Puzzle," nothing happens.
Additionally, the console logs "POST /admin/puzzles 404 (Not Found)" and "Unexpected token '<'".
How can I fix puzzle creation functionality and ensure the endpoint works correctly?
4. **Debugging and Diagnostics**
I suspect there is a mismatch in some database or route names causing persistent errors.
How can I diagnose and verify my running build and routes using endpoints like /__version and /__routes?
## Notes
- Prompts guided fixing DB schema issues that broke the leaderboard.
- Removed invalid SQL comments and alias issues.
- Added migrations for tables.
- Added diagnostic endpoints to verify the running build and routes.
# Task 3: Tap Sprint Game – Live Highest Score Highlight
## Prompts
**Live Leader Highlighting**
I want the Tap Sprint game to highlight the player with the highest score in real time.
How can I dynamically update the UI so that the leading player's box is visually distinct as the scores change during gameplay?

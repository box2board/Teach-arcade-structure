# Midway Mayhem recovery and release checklist

This branch is a recovery record in the Teach Arcade repository. Its base is Teach Arcade main. The separate multiplayer site's last saved release is version 10, source commit `e4f71870764e1e3999c9882e423d8febc7061bbc`. The playtest checkout last observed at `082e3d227bb6daf138ccdde910a464dc0442bb4d` used the separate Sites source repository. Recover that checkout first if it returns. Otherwise reconstruct from the last accessible multiplayer source. The release record does not contain the recovered application.

## Acceptance criteria

- Choose a question set from Originals or the signed-in teacher's Cabinet before choosing mode, teams, and rounds. Show the selected title and count to the host in the lobby. Keep private-set metadata out of the student view.
- Run Red Light, Green Light, Spotlight Sneak, and Bumper Boats through the existing shared lobby and Midway game flow. Reuse selected characters, keep game modules separate, and let Midway convert game scores to team rewards.
- Verify the build, run the 12-player, four-team, three-round simulation, and smoke-test a hosted teacher and student session before recording the release as ready.

## Prevent workspace loss

- Before ending any session with functional changes, commit the affected source and push it to a durable work branch. Include untracked modules and fixtures needed to build. Keep credentials and generated dependencies out of Git.
- Verify that the exact commit SHA exists on the remote branch. Save the pushed SHA in the handoff. A local commit, a passing test, and an open preview are each insufficient as recovery points.
- Promote only a build produced from the pushed SHA. Record the Sites version ID, deployment status, verification result, and previous version for rollback. If pushing is blocked, save a private source archive containing the changes and the base SHA while files are still accessible, then verify the archive is retrievable.

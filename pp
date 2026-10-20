Integrate the Stream Loader frontend with the existing Bash loader script. Keep this work separate from the frontend-only pull request.

The existing script is the source of truth for loading. It accepts stream name, platform, cut, work-of date, and a destination environment. It retrieves the matching archived file from the production archive history data, transfers it to the lower region using SFTP, then runs the same load scripts used by the current process. Do not rewrite or alter the loader workflow unless required for a safe interface.

Build a server-side wrapper that the browser UI can call. The UI flow is:
1. Select Dev or QA.
2. Select SPS or FSAMS.
3. Select a valid stream name, platform, cut, and work-of date.
4. Review the selected values and explicitly confirm.
5. Show the job’s current step, progress, optional live logs, load identifier, and final stream status.

Replace sample stream, platform, and cut values with validated values from an authoritative configuration or source. Do not let the browser choose arbitrary server paths, commands, or script names.

Security and execution requirements:
- Never collect, store, or send shared server passwords through the browser.
- Reuse only an approved server-side service identity or existing credential mechanism. Do not hard-code credentials.
- Authenticate and authorize users before starting loads; restrict destinations to approved lower environments.
- Validate every parameter server-side, including allowed environment/application combinations and date format.
- Invoke the script with an argument array or another safe process API; do not build shell commands from untrusted input.
- Prevent duplicate submissions and define how concurrent jobs are queued or rejected.
- Keep secrets and sensitive archive data out of logs; redact sensitive values.
- Record who started each job, the chosen parameters, timestamps, result, and load identifier according to the organization’s audit requirements.

For job updates, expose a status API and a live update mechanism such as Server-Sent Events or WebSockets. Return clear states for queued, running, completed, and failed jobs, along with the current loader step. Stream log lines as they become available and report useful errors without exposing credentials or internal secrets.

Run the wrapper under an approved service account. If Node.js is unavailable on the lower-region server, document the approved deployment choice—such as installing an approved Node runtime or using an existing supported server integration—before changing server software. Keep Apache as the web server or reverse proxy if that fits the environment.

Deliver the server-side implementation, configuration and deployment instructions, tests using a safe non-production setup, and a documented API contract for the frontend. Do not run an actual production archive transfer or database load during development or testing.

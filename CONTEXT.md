# DTO & Mapper Workshop

This context defines the people and system boundaries of the browser workshop.

## Language

**Participant**:
A junior developer who completes the guided workshop in a browser without installing local development tools.
_Avoid_: User, student, developer

**Workshop Developer**:
A contributor who builds, tests, or runs the workshop repository locally.
_Avoid_: Participant, user

**Workshop Web App**:
The browser interface through which a Participant reads the learning content and completes the workshop.
_Avoid_: Frontend, website, client

**Demo API**:
The server-side workshop boundary that provides deterministic demonstration data and operational health information. It never receives Participant code.
_Avoid_: Backend, workshop server

**Walking Skeleton**:
The smallest working connection from the Workshop Web App to the real Demo API. It proves the integration boundary without implementing workshop exercises.
_Avoid_: Prototype, complete workshop

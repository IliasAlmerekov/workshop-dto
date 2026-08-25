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

### Editor assistance

Two different things help a Participant write code. Calling either one "a hint" collapses the distinction and makes questions like "how much help do we give?" unanswerable.

**Hint**:
Staged guidance a Participant asks for and the Workshop Web App counts, moving from concept to the track's syntax over three cards.
_Avoid_: Tip, suggestion, completion

**Completion**:
Symbol suggestions the editor offers unasked while a Participant types, drawn from the task's inputs and the track's built-ins. It is never counted and never names the target the Participant is building.
_Avoid_: Hint, autocomplete, IntelliSense

### Exercise content

**Task Brief**:
The compact exercise card that tells a Participant the concrete situation, the intended outcome, and the boundaries before they edit code.
_Avoid_: Field list, code recipe, solution

**Legacy Registration Payload**:
The unnormalised field names and values submitted by the older registration screen before the Workshop Web App maps them into its own request contract.
_Avoid_: Raw data, request DTO, external API response

### Completion

**Certificate**:
The keepsake document a Participant generates in the browser after solving all four tasks and
passing the knowledge check. It records completion, not attendance, and nothing issues, registers
or verifies it.
_Avoid_: Diploma, badge, credential, Teilnahmezertifikat

**Issuing Institute**:
The fictional body named on the Certificate as its author. It exists so the document can look like
a diploma without any real organisation appearing to vouch for it.
_Avoid_: Organisation, sponsor, authority

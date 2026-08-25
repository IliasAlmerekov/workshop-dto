# The Certificate is a keepsake from a fictional institute

The workshop's Certificate is styled as a real diploma — engraved guilloche border, pressed seal
with a Latin motto, two signatures, a serif and a script face embedded in the PDF — and it carries
no disclaimer. That is defensible because of what the document deliberately does *not* claim.

**The issuer is fictional, the signatories are not.** The Certificate is awarded by the
"International Institute of Data Transfer Objects". Anyone can type any name into the form and
download a document, so putting a real organisation in the issuer position would make that
organisation appear to vouch for an unverified claim. A fictional institute keeps the joke visible
while the craft stays serious. The two signatures carry the real workshop instructors' names at
their own request; the titles under them belong to the fictional institute.

**Nothing on it looks like a record.** An earlier draft carried a credential number and a hosting
organisation in the footer. Both were removed: a number formatted like a registry entry invites
someone to try to verify it, and there is nothing to verify against — the workshop's "no accounts,
no server state, no database" invariant rules out a register. The award date lives in the citation
sentence instead, where it reads as prose rather than as metadata.

## Consequences

- The Certificate leaves the `DESIGN.md` palette behind for cream, ink-navy and gold. It is a
  printed document, not a themed UI surface, and the product's greys and blues are what made the
  first version read as a screenshot of an app. This is the one sanctioned exception to
  `DESIGN.md`; it is not licence to fork the palette anywhere else.
- The document names neither the track nor the exercise count, so `downloadCertificate` needs only a
  name and a date and stays independent of `WorkshopContext`.
- Two OFL typefaces (EB Garamond, Great Vibes) ship base64-encoded in the repository, subset to the
  characters the document uses. They are reachable only through the dynamically imported
  certificate module, so `/workshop`'s initial bundle is unaffected.

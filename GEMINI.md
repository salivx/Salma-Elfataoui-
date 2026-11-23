# GEMINI.md

Les instructions communes à tous les assistants sont dans AGENTS.md (importé ci-dessous).

@AGENTS.md

## Spécifique à Gemini (CLI / Code Assist)

- Au début de chaque session : lire `HANDOFF.md` puis `ARCHITECTURE.md`.
- Rappel des règles clés : une classe par fichier ; tout élément animé ou potentiellement
  mobile est un `Vehicle` ou une sous-classe ; mouvement uniquement par steering behaviors ;
  les comportements renvoient des forces (`steering = desired - velocity`, limitée à
  `maxForce`).
- En fin de tâche : `node tools/update-readme.mjs`, puis mettre à jour `HANDOFF.md`.
- Répondre en français.

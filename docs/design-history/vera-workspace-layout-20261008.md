# Workspace prompt layout — 8 October 2026

The empty workspace now reserves the lower edge for the research prompt. Its
welcome heading and explanation stay above, with a responsive gap between them
and the prompt. This makes the input easier to find in a new workspace and
keeps the existing prompt position while a conversation is open. The project
sidebar, top-level tools, suggestion list, and chat transcript retain their
own areas. The workspace also uses a more compact scale for its heading,
navigation labels, suggestion cards, project picker, and composer. Text in the
conversation stays at its reading size.

The prompt uses the normal available space instead of a fixed screen offset.
At short heights or narrow widths, the research area remains scrollable and the
composer keeps its existing small-screen padding.

Applied in `ui/src/vera.css`; changes appear on the running localhost UI after
refreshing `http://127.0.0.1:5201/`. The main desktop executable has not been
rebuilt in this localhost review step.

# Local models with OpenCode

OpenCode runs the agent loop, including file edits, commands, and tools. LM
Studio, oMLX, Ollama, or another compatible server can run the model locally.
No VERA account is needed. Existing OpenCode providers remain available too.

## Connect a local model

In VERA, choose **Add Local Model** under OpenCode in the model picker, or open
**Settings → Harnesses → OpenCode → Add local model**. The setup screen checks
compatibility; add and configure a server in the model dialog.

1. Choose the model server application. Install OpenCode if VERA reports that it
   is missing.
2. Follow the server setup instructions below. Load a model that supports tool
   calling and start its local API server.
3. Check the server address in VERA and choose **Find models**. Expand
   **Authentication** only if the server requires a credential.
4. Select a model. Set its context window to match the value loaded by the model
   server; 32K is a useful starting point for agent tools.
5. Choose **Save model**, then select it under OpenCode in the model picker. An
   existing chat keeps its harness, so start a new chat to switch harnesses.

VERA stores these connections in its local data directory rather than in
OpenCode's configuration files. Existing provider settings and credentials are
preserved. Connecting another model from the same server adds it to that
connection. Disconnecting a server in Settings removes it from new chats; it
does not stop the server or delete downloaded models.

## LM Studio

Install LM Studio from https://lmstudio.ai and complete its desktop setup.
Enable **Developer Mode**. If a model is already downloaded, skip the suggested
first download and use that model.

Choose **Load Model**, enable **Manually choose model load parameters**, select
a tool-capable model, and set **Context Length** to **32768** when memory
permits. Then open **Developer → Local Server** and start the server. The
default VERA address is http://127.0.0.1:1234/v1.

Keep LM Studio running while using its model. LM Link and cloud login are not
required for a server on the same computer.

## oMLX on Apple Silicon

Install oMLX from https://github.com/jundot/omlx. Put a tool-capable MLX model
in its model directory, start the server, and keep it running. The default
address is http://127.0.0.1:8000/v1. oMLX can load a discovered model on its
first request.

## Ollama

Install Ollama from https://ollama.com, download a model with tool support, and
keep Ollama running. The default address is http://127.0.0.1:11434/v1. This
provider uses the same OpenAI-compatible connection flow.

## Other OpenAI-compatible servers

Choose **Custom Endpoint (OpenAI compatible)** for a server such as vLLM. It
must expose **GET /v1/models** and tool-capable chat completions. Enter the base
URL ending in **/v1**, and add an API key under **Authentication** if required.

The address is relative to the machine running VERA. With VERA's SSH remote-host
mode, run the model server on that remote machine and use
http://127.0.0.1:8000/v1. To run an agent on a Mac while inference runs on
another machine, forward the model server over SSH and enter the forwarded local
address instead.

## Troubleshooting and privacy

- **Cannot reach the server:** start it in the model application and verify the
  address.
- **No models:** download or load a model, then check again.
- **Authentication required:** enter the local server's API key.
- **Saved model missing from OpenCode:** check the installed agent and any
  explicit OpenCode provider allowlist or administrator policy. VERA does not
  remove those restrictions.
- **Context errors:** match the context setting to the model server's loaded
  window. A small model or short context may not handle coding tools reliably.

Models added through VERA also handle OpenCode's auxiliary title requests, and
OpenCode sharing is disabled for those local sessions. A local server failure
fails or retries that request; it does not switch to a cloud model.

Local inference does not mean the entire research workflow is offline.
Downloads, paper searches, GitHub operations, connected tools, and agent
commands may use the network. VERA's optional usage analytics setting is
separate from model routing.

Existing manually configured loopback providers in OpenCode remain supported.
Declare their models and **options.baseURL** in OpenCode's global
configuration. If authentication is required, use **options.apiKey** for
readiness checks.

from __future__ import annotations

import json
import os
import shutil
import subprocess
from typing import Any, Dict
from urllib import error, request


DEFAULT_BASE_URL = "http://127.0.0.1:18789"
DEFAULT_HOOKS_PATH = "/hooks"


class OpenClawError(RuntimeError):
    pass


def _normalize_base_url(raw_url: str | None) -> str:
    return (raw_url or DEFAULT_BASE_URL).rstrip("/")


def _normalize_hooks_path(raw_path: str | None) -> str:
    path = (raw_path or DEFAULT_HOOKS_PATH).strip() or DEFAULT_HOOKS_PATH
    return path if path.startswith("/") else f"/{path}"


def _read_required_token() -> str:
    token = (os.environ.get("OPENCLAW_HOOK_TOKEN") or "").strip()
    if not token:
        raise OpenClawError("OPENCLAW_HOOK_TOKEN is not set.")
    return token


def _post_json(url: str, payload: Dict[str, Any], token: str) -> Dict[str, Any]:
    raw_body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url,
        data=raw_body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=60) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {"ok": True}
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        status_code = exc.code
        if status_code == 429:
            raise OpenClawError("OpenClaw API rate limit reached. Please try again later.")
        raise OpenClawError(f"OpenClaw returned HTTP {status_code}: {detail[:300]}")
    except error.URLError as exc:
        raise OpenClawError(f"Could not reach OpenClaw gateway: {exc.reason}") from exc
    except json.JSONDecodeError as exc:
        raise OpenClawError("OpenClaw returned a non-JSON response.") from exc


def _extract_text_from_response(response: Dict[str, Any]) -> str | None:
    direct_text = (
        response.get("text")
        or response.get("response")
        or response.get("message")
        or response.get("output")
    )
    if isinstance(direct_text, dict):
        direct_text = direct_text.get("text") or direct_text.get("content")
    if isinstance(direct_text, str) and direct_text.strip():
        return direct_text.strip()

    result = response.get("result")
    if isinstance(result, dict):
        payloads = result.get("payloads")
        if isinstance(payloads, list):
            for payload in payloads:
                if not isinstance(payload, dict):
                    continue
                text = payload.get("text")
                if isinstance(text, str) and text.strip():
                    return text.strip()
    return None


def _invoke_openclaw_via_cli(message: str, session_id: str) -> Dict[str, Any]:
    binary = shutil.which("openclaw")
    if not binary:
        raise OpenClawError("OpenClaw CLI is not installed or not on PATH.")

    timeout_seconds = int((os.environ.get("OPENCLAW_TIMEOUT_SECONDS") or "60").strip() or "60")
    command = [
        binary,
        "agent",
        "--session-id",
        session_id,
        "--message",
        message,
        "--json",
        "--timeout",
        str(timeout_seconds),
    ]

    thinking = (os.environ.get("OPENCLAW_THINKING") or "").strip()
    if thinking:
        command.extend(["--thinking", thinking])

    agent_id = (os.environ.get("OPENCLAW_AGENT_ID") or "").strip()
    if agent_id:
        command.extend(["--agent", agent_id])

    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout_seconds + 15,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise OpenClawError(
            f"OpenClaw agent timed out after {timeout_seconds} seconds."
        ) from exc

    output = (completed.stdout or "").strip()
    error_text = (completed.stderr or "").strip()

    if completed.returncode != 0:
        detail = error_text or output or f"exit code {completed.returncode}"
        raise OpenClawError(f"OpenClaw agent command failed: {detail[:500]}")

    try:
        response = json.loads(output)
    except json.JSONDecodeError as exc:
        raise OpenClawError("OpenClaw CLI returned non-JSON output.") from exc

    text = _extract_text_from_response(response)
    if not text:
        raise OpenClawError(
            "OpenClaw completed, but no final text reply was present in the CLI response."
        )

    return {
        "text": text,
        "session_id": session_id,
        "provider": "openclaw",
        "raw": response,
    }


def _invoke_openclaw_via_hook(message: str, session_id: str) -> Dict[str, Any]:
    token = _read_required_token()
    base_url = _normalize_base_url(os.environ.get("OPENCLAW_BASE_URL"))
    hooks_path = _normalize_hooks_path(os.environ.get("OPENCLAW_HOOKS_PATH"))
    endpoint = f"{base_url}{hooks_path}/agent"

    payload: Dict[str, Any] = {
        "message": message,
        "name": os.environ.get("OPENCLAW_AGENT_NAME", "Whobee"),
        "deliver": "none",
    }

    agent_id = (os.environ.get("OPENCLAW_AGENT_ID") or "").strip()
    if agent_id:
        payload["agentId"] = agent_id

    model = (os.environ.get("OPENCLAW_MODEL") or "").strip()
    if model:
        payload["model"] = model

    thinking = (os.environ.get("OPENCLAW_THINKING") or "").strip()
    if thinking:
        payload["thinking"] = thinking

    timeout_seconds = (os.environ.get("OPENCLAW_TIMEOUT_SECONDS") or "").strip()
    if timeout_seconds.isdigit():
        payload["timeoutSeconds"] = int(timeout_seconds)

    response = _post_json(endpoint, payload, token)
    text = _extract_text_from_response(response)

    if not isinstance(text, str) or not text.strip():
        raise OpenClawError(
            "OpenClaw responded, but no text reply was present in the response body."
        )

    return {
        "text": text.strip(),
        "session_id": session_id,
        "provider": "openclaw",
        "raw": response,
    }


def invoke_openclaw_agent(message: str, session_id: str = "trialforge-user") -> Dict[str, Any]:
    mode = (os.environ.get("OPENCLAW_TRANSPORT") or "cli").strip().lower()
    if mode == "hook":
        return _invoke_openclaw_via_hook(message=message, session_id=session_id)
    return _invoke_openclaw_via_cli(message=message, session_id=session_id)

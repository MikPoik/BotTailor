# AGENTS — Repo Guide for AI Coding Agents and Developers

This project is a full-stack React chat widget application featuring an Express.js backend and a React frontend. Its primary purpose is to provide an embeddable customer support chat widget for any website. The widget supports rich messaging, including text, interactive cards, menus, and quick replies, aiming to offer a comprehensive and customizable communication tool for businesses. The vision is to enable seamless integration of sophisticated chat functionalities, enhancing user engagement and support capabilities across various web platforms.

## Purpose

This file is a concise operating summary for AI coding agents and humans working in this repository. It explains where to find domain documentation, the recommended read order, and key conventions to follow when making code or documentation changes.

**CRITICAL: Before starting any task, agents MUST read relevant documentation in `docs/agents/` (e.g., `openai.md`, `frontend.md`, `api.md`) to understand the current implementation and architectural constraints.**

## Universal AI Coding Workflow

Always start by briefly rephrasing the user’s goal before any tool use. When using tools, explain why (purpose) not what you’re doing. Use a to-do list to track progress. Keep summaries under three sentences and never self-reference.

**Workflow:**
1. Deeply understand the issue—expected behavior, edge cases, dependencies, pitfalls, context.
2. Explore relevant code and files and **MANDATORY: Read relevant documents in `docs/agents/`**.
3. Research external sources if needed.
4. Privately plan next steps (do not display).
5. Implement small, testable changes.
6. Debug logically and isolate issues.
7. Test after each change.
8. Iterate until root cause is fixed and all tests pass.

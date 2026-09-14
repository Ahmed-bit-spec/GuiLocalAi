# Local Chat

A privacy-oriented desktop interface for locally hosted language models, implemented with Electron and integrated with Ollama.

Local Chat provides a minimal interface for interacting with language models running on the user's own machine. The application is designed around local execution and persistent local storage, with no requirement for a cloud-based AI service or external API credentials.

The current implementation provides conversational interaction with Ollama models. The longer-term objective is to develop the application into a local AI development environment capable of analyzing software projects, generating and modifying source code, executing development workflows, and assisting with software engineering tasks under explicit user-controlled permissions.

---

## Overview

Local Chat consists of three principal components:

```text
┌──────────────────────────────┐
│          Local Chat          │
│            Electron          │
└──────────────┬───────────────┘
               │
               │ Local API
               ▼
┌──────────────────────────────┐
│            Ollama            │
│       Local Language Model   │
└──────────────┬───────────────┘
               │
               ▼
          Local Machine
```

Electron provides the graphical desktop environment, while Ollama provides the local model-serving infrastructure.

The separation between the user interface and model execution allows the application to remain relatively lightweight while permitting users to select and operate different locally available models.

---

## Current Capabilities

### Local Model Execution

Local Chat communicates with an Ollama instance running on the user's machine.

The application supports:

* Local language-model inference
* Model selection
* Temperature configuration
* System-prompt configuration
* Persistent conversations
* Conversation search
* Response regeneration
* Response copying
* Response cancellation

No cloud AI provider is required.

### Desktop Application

The application is implemented using Electron and is intended to operate as a conventional desktop application on Linux, Windows, and macOS.

The interface intentionally follows a minimal visual design in order to reduce unnecessary interaction complexity and maintain emphasis on the conversational interface.

### Persistent Storage

Conversations and application settings are stored locally using Electron's operating-system-specific application data directory.

No cloud synchronization mechanism is implemented.

---

# Privacy and Local Execution

Local Chat is designed around a local-first architecture.

The application communicates with a locally running Ollama server rather than transmitting prompts and conversations to a remote inference provider.

Consequently, the privacy characteristics of the system are primarily determined by the local machine, its operating system, Ollama, and the models installed by the user.

The application does not require:

* An online account
* An AI provider API key
* Cloud synchronization
* A remote database

Internet access is not required for normal inference after the required software and models have been installed.

---

# Installation

## Using a Release

Users do not need Node.js, npm, or the source repository to use a packaged release.

Download the appropriate release artifact from the GitHub Releases section.

## Linux

### Debian and Ubuntu

Install the Debian package:

```bash
sudo dpkg -i local-chat_1.0.0_amd64.deb
```

The application can subsequently be launched from the desktop application menu or with:

```bash
local-chat
```

To remove the application:

```bash
sudo apt remove local-chat
```

### AppImage

Make the AppImage executable:

```bash
chmod +x "Local Chat-1.0.0.AppImage"
```

Execute it:

```bash
./"Local Chat-1.0.0.AppImage"
```

AppImage does not require a conventional system installation and is therefore suitable for portable deployments.

## Windows

Download the `.exe` installer from the release page and execute it using the standard Windows installation procedure.

## macOS

Download the `.dmg` package from the release page and install the application using the standard macOS installation procedure.

---

# Ollama

Local Chat requires Ollama as its model-serving backend.

Install Ollama from:

https://ollama.com

After installation, download at least one compatible model.

For example:

```bash
ollama pull qwen2.5-coder:1.5b
```

The installed model can subsequently be selected from the application's configuration interface.

Ollama is not bundled with Local Chat. This separation is intentional because model requirements vary substantially according to available CPU, GPU, memory, and storage resources.

---

# Building From Source

## Requirements

The development environment requires:

* Node.js 18 or later
* npm
* Ollama
* At least one locally installed Ollama model

Clone the repository:

```bash
git clone https://github.com/Ahmed-bit-spec/GuiLocalAi.git
```

Change into the project directory:

```bash
cd GuiLocalAi
```

Install dependencies:

```bash
npm install
```

Start the development application:

```bash
npm start
```

---

# Usage

## Creating a Conversation

Create a new conversation from the sidebar.

Keyboard shortcut:

```text
Ctrl + N
```

On macOS:

```text
Cmd + N
```

## Searching Conversations

Focus the conversation search field with:

```text
Ctrl + K
```

On macOS:

```text
Cmd + K
```

## Cancelling Generation

A running response can be cancelled using the Stop control or:

```text
Esc
```

## Configuration

The settings interface provides control over:

* Ollama model
* Temperature
* System prompt

These parameters are stored locally and persist across application restarts.

---

# Building Distribution Packages

Linux packages can be generated with:

```bash
npm run dist:linux
```

Windows packages:

```bash
npm run dist:win
```

macOS packages:

```bash
npm run dist:mac
```

Generated artifacts are placed in the `dist` directory.

A typical Linux build produces:

```text
dist/
├── Local Chat-1.0.0.AppImage
└── local-chat_1.0.0_amd64.deb
```

Electron Builder generally provides the most reliable results when packaging on the operating system for which the application is being built.

---

# Architecture

The current system can be conceptually represented as:

```text
User
 │
 ▼
Electron Interface
 │
 ▼
Application Logic
 │
 ▼
Ollama Local API
 │
 ▼
Local Language Model
 │
 ▼
Generated Response
```

This architecture deliberately maintains a distinction between presentation, application logic, and model inference.

Such separation provides a foundation for introducing additional local tools without requiring fundamental changes to the model-serving layer.

---

# Development Roadmap

The current implementation represents the conversational layer of a broader local AI system.

## Phase I: Conversational Interface

Completed or substantially implemented:

* Electron desktop application
* Ollama integration
* Persistent conversations
* Conversation search
* Model selection
* Temperature configuration
* System-prompt configuration
* Response regeneration
* Response copying
* Response cancellation
* Linux packaging

Planned:

* Windows distribution
* macOS distribution
* Automated multi-platform releases

---

# Phase II: Project-Level Intelligence

The next architectural step is to provide the model with structured access to software projects.

Potential capabilities include:

* Project directory selection
* File-system exploration
* Source-code inspection
* Project-structure analysis
* Cross-file search
* Context-aware code generation
* Code explanation
* Dependency analysis
* Documentation generation

At this stage, the application would transition from a conventional conversational interface toward a software-engineering environment.

---

# Phase III: Local Coding Agent

A subsequent objective is to provide controlled tool execution.

A potential workflow is:

```text
User Request
     │
     ▼
Task Analysis
     │
     ▼
Project Inspection
     │
     ▼
Plan Generation
     │
     ▼
Proposed File Changes
     │
     ▼
User Authorization
     │
     ▼
File Modification
     │
     ▼
Test Execution
     │
     ▼
Error Analysis
     │
     ▼
Code Correction
     │
     ▼
Verification
```

Such an architecture would allow the model to participate in iterative software development rather than merely generating isolated code fragments.

Potential operations include:

* Creating source files
* Modifying existing source files
* Refactoring code
* Generating tests
* Executing tests
* Interpreting compiler errors
* Debugging applications
* Generating documentation
* Performing structured project analysis

---

# Security Model

Introducing file-system and command-execution capabilities fundamentally changes the security requirements of the application.

For this reason, future agent functionality should not provide unrestricted access to the host operating system.

A permission-oriented architecture is preferable.

For example:

```text
Read project files        Allowed
Create source file        Allowed
Modify source file        Requires authorization
Execute test command      Requires authorization
Execute arbitrary command Requires authorization
Delete project            Restricted
Read credentials          Restricted
Access private keys       Restricted
```

The objective is to establish a clear security boundary between model-generated intentions and operations performed against the host system.

The model should therefore be treated as an untrusted computational component whose access to external resources is mediated by explicit application-level tools and authorization policies.

---

# Long-Term Objective

The long-term objective of Local Chat is to provide a local AI development environment in which language models can reason over software projects and interact with development tools while maintaining user control over data and system operations.

A conceptual future architecture is:

```text
┌────────────────────────────────────────────┐
│                Local Chat                  │
├───────────────────┬────────────────────────┤
│                   │                        │
│   Project Model   │    AI Development      │
│                   │        Agent           │
│   File System     │                        │
│   Source Code     │    Planning            │
│   Dependencies    │    Code Generation     │
│   Configuration   │    Modification        │
│                   │    Testing             │
│                   │    Debugging           │
└───────────────────┴────────────────────────┘
             │
             ▼
      Local Ollama Models
```

The fundamental design principle is local execution combined with explicit control.

The objective is not merely to provide another chat interface, but to develop an environment in which local language models can become practical computational assistants for software development while preserving the user's authority over source code, files, and system operations.

---

# Contributing

Contributions, technical discussions, bug reports, and feature proposals are welcome.

To contribute:

```bash
git checkout -b feature/my-feature
```

Implement and test the changes, then:

```bash
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

Open a pull request against the `main` branch.

Architectural changes should preferably be discussed before implementation when they affect the application's security model, persistence layer, model interface, or tool-execution framework.

---

# License

Local Chat is distributed under the MIT License.

The MIT License permits use, modification, redistribution, and commercial use of the software, subject to the conditions specified by the license.

---

# Project

Repository:

https://github.com/Ahmed-bit-spec/GuiLocalAi

Local Chat is an ongoing project focused on the intersection of local language models, desktop computing, software engineering automation, and privacy-preserving AI systems.

**Local models. Local execution. User-controlled computation.**

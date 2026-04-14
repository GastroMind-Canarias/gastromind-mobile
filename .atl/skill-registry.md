# Skill Registry - gastromind-mobile

## Project Standards

### Tech Stack
- **Framework**: Expo ~54, React 19, React Native 0.81.
- **Navigation**: @react-navigation/native + stack + tabs.
- **API**: axios with central `apiClient`.
- **State**: AsyncStorage (key: `userToken`).
- **Language**: TypeScript (strict: true).

### Architecture Conventions
- **Domain-Driven/Hexagonal**:
  - `src/core/domain`: Domain types.
  - `src/adapters/external/api`: HTTP services & interceptors.
  - `src/adapters/ui`: Screens, components, hooks, navigation.
  - `src/shared/theme`: Shared styles and colors.
- **Data Flow**: `domain` -> `service` -> `ui`.
- **API Access**: ALWAYS reuse `apiClient` from `src/adapters/external/api/apiClient.ts`.
- **Styling**: Follow existing `COLORS` from `src/shared/theme/colors.ts`.

### Security & Config
- **Auth**: Token in `AsyncStorage` (`userToken`) + authorization interceptors.
- **Environment**: Base URL in `.env` (`EXPO_PUBLIC_API_URL`).

## Active Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| branch-pr | Creating PR, opening PR | PR creation workflow following issue-first enforcement. |
| issue-creation | Creating GitHub issue | Issue creation workflow following issue-first enforcement. |
| judgment-day | "judgment day", "review adversarial" | Parallel adversarial review protocol. |
| sdd-apply | Orchestrator launch (Apply) | Implement tasks from the change. |
| sdd-archive | Orchestrator launch (Archive) | Sync delta specs and archive completed change. |
| sdd-design | Orchestrator launch (Design) | Create technical design document. |
| sdd-explore | Orchestrator launch (Explore) | Explore ideas before committing to a change. |
| sdd-init | User says "sdd init", "iniciar sdd" | Initialize SDD context in project. |
| sdd-propose | Orchestrator launch (Propose) | Create or update change proposal. |
| sdd-spec | Orchestrator launch (Spec) | Write specifications with requirements. |
| sdd-tasks | Orchestrator launch (Tasks) | Break down change into implementation tasks. |
| sdd-verify | Orchestrator launch (Verify) | Validate implementation matches specs. |

## Compact Rules

### Architecture & Pattern Rules
- Maintain Hexagonal architecture boundaries. Do not import UI components into domain or service layers.
- Reuse `apiClient` for all HTTP calls.
- Centralize all endpoints in `src/adapters/external/api`.
- Keep components small; extract from large screens if necessary.

### Coding Rules
- Use strict TypeScript.
- Follow `COLORS` from `src/shared/theme/colors.ts`.
- Use `AsyncStorage` for persistence as established.
- Avoid hardcoding URLs.

### Documentation Rules
- Follow RFC 2119 keywords (MUST, SHALL, SHOULD, MAY) in specs.
- Use Given/When/Then for scenarios.

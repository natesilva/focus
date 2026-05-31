## 1. Profile Catalog

- [x] 1.1 Create `src/profiles/types.ts` with the `Profile` type (`name: string`, `install: string[]`, `volumes: string[]`)
- [x] 1.2 Create `src/profiles/catalog.ts` with built-in profiles: `git`, `ripgrep`, `node`, `python`, `rust`, `claude-code`, `ssh`
- [x] 1.3 Write install commands for each built-in profile (apt-get, curl-based installs as appropriate)
- [x] 1.4 Annotate each built-in profile with its required volume slots (e.g., `claude-code` → `["claude"]`, `ssh` → `["ssh"]`)

## 2. Custom Profile Loading

- [x] 2.1 Create `src/profiles/custom.ts` with a function to load YAML files from `<focusConfigDir>/profiles/`
- [x] 2.2 Define Zod schema for custom profile YAML (`install: z.array(z.string())`, `volumes: z.array(z.string()).default([])`)
- [x] 2.3 Handle absent custom profile directory gracefully (return empty map, no error)
- [x] 2.4 Throw descriptive error on invalid custom profile YAML including the file path

## 3. Profile Lookup

- [x] 3.1 Create `src/profiles/index.ts` with `getProfile(name, configDir)` that merges custom (priority) and built-in catalogs
- [x] 3.2 Throw a descriptive error for unknown profile names listing the profile name

## 4. Image Builder

- [x] 4.1 Create `src/image-builder.ts` with a `buildImage(profiles: string[], baseImage: string, configDir: string): Promise<string>` function
- [x] 4.2 Implement content-addressed tag computation: SHA-256 of `baseImage + "\n" + sorted profiles`, first 12 hex chars, tag format `focus-built:<hash>`
- [x] 4.3 Implement cache check via `docker image inspect <tag>` — skip build if image exists
- [x] 4.4 Implement Dockerfile generation: `FROM <baseImage>` + one `RUN` block per profile in alphabetical order
- [x] 4.5 Invoke `docker build` with the generated Dockerfile piped via stdin (`docker build -t <tag> -`), streaming output to stderr
- [x] 4.6 Return the base image string unchanged when the profiles list is empty (no Docker invocation)

## 5. Container Launch Integration

- [x] 5.1 Update `src/container.ts` to call `buildImage` with `config.tools` and `config.image` before launching
- [x] 5.2 Use the tag returned by `buildImage` as the container image instead of `config.image` directly

## 6. Tests

- [x] 6.1 Write unit tests for the content-addressed tag computation (same inputs → same tag, different inputs → different tags)
- [x] 6.2 Write unit tests for Dockerfile generation (correct `FROM`, correct `RUN` order, one `RUN` per profile)
- [x] 6.3 Write unit tests for custom profile Zod validation (valid, missing `install`, extra fields rejected)
- [x] 6.4 Write unit tests for `getProfile` lookup (built-in found, unknown throws, custom overrides built-in)

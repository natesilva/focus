## 1. Fix entrypoint prompt injection

- [x] 1.1 In `src/entrypoint.sh`, change the `grep -q` guard target from `/etc/bash.bashrc` to `"$ACTUAL_HOME/.bashrc"`
- [x] 1.2 Change both `cat >>` append targets from `/etc/bash.bashrc` to `"$ACTUAL_HOME/.bashrc"`

## 2. Update tests

- [x] 2.1 In `test/entrypoint/`, add or update a test case that verifies the custom PS1 appears when no profile volumes are present (home directory created fresh by `useradd -m` with skel)
- [x] 2.2 Verify the existing idempotency test still passes (guard now checks `~/.bashrc`)

## 3. Verify behavior end-to-end

- [x] 3.1 Run `pnpm test` and confirm all tests pass

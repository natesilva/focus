#!/usr/bin/env bats

# ubuntu:24.04 ships an 'ubuntu' user at UID 1000 with home /home/ubuntu.
# This lets us test the divergent-home path without any special setup.

ENTRYPOINT=/usr/local/bin/entrypoint.sh

setup() {
  # Reset ubuntu's home to root ownership (simulating the runtime pre-creating
  # it as root to host bind-mounted volume subdirectories).
  rm -rf /home/ubuntu /home/focususer
  mkdir -p /home/ubuntu
  chown root:root /home/ubuntu
  mkdir -p /home/focususer
}

teardown() {
  userdel focususer 2>/dev/null || true
  rm -rf /home/ubuntu /home/focususer
}

@test "home directory is owned by the container user after entrypoint runs" {
  run env FOCUS_UID=1000 bash "$ENTRYPOINT" true
  [ "$status" -eq 0 ]
  run stat -c '%u' /home/ubuntu
  [ "$output" = "1000" ]
}

@test "container user can create a file directly in HOME" {
  env FOCUS_UID=1000 bash "$ENTRYPOINT" touch /home/ubuntu/testfile
  [ -f /home/ubuntu/testfile ]
}

@test "volume dotdirs are symlinked into a divergent home" {
  mkdir -p /home/focususer/.claude
  mkdir -p /home/focususer/.ssh
  run env FOCUS_UID=1000 bash "$ENTRYPOINT" true
  [ "$status" -eq 0 ]
  [ -L /home/ubuntu/.claude ]
  [ "$(readlink /home/ubuntu/.claude)" = "/home/focususer/.claude" ]
  [ -L /home/ubuntu/.ssh ]
  [ "$(readlink /home/ubuntu/.ssh)" = "/home/focususer/.ssh" ]
}

@test "existing entries at symlink target paths are not overwritten" {
  mkdir -p /home/focususer/.claude
  # Pre-create a real directory at the would-be symlink target
  mkdir -p /home/ubuntu/.claude
  run env FOCUS_UID=1000 bash "$ENTRYPOINT" true
  [ "$status" -eq 0 ]
  # Must still be a real directory, not a symlink
  [ ! -L /home/ubuntu/.claude ]
  [ -d /home/ubuntu/.claude ]
}

@test "prompt is written to ~/.bashrc" {
  run env FOCUS_UID=1000 FOCUS_PROMPT_STYLE=two-line bash "$ENTRYPOINT" true
  [ "$status" -eq 0 ]
  grep -q '# focus-prompt' /home/ubuntu/.bashrc
}

@test "prompt is appended after existing .bashrc content (skel override)" {
  # Simulate a skel-generated .bashrc that already sets PS1
  echo "PS1='\\u@\\h:\\w\\$ '" > /home/ubuntu/.bashrc
  run env FOCUS_UID=1000 FOCUS_PROMPT_STYLE=two-line bash "$ENTRYPOINT" true
  [ "$status" -eq 0 ]
  grep -q '# focus-prompt' /home/ubuntu/.bashrc
  # focus-prompt block must come after the skel PS1 line so it wins
  skel_line=$(grep -n "PS1='\\\\u@\\\\h" /home/ubuntu/.bashrc | cut -d: -f1)
  focus_line=$(grep -n '# focus-prompt' /home/ubuntu/.bashrc | cut -d: -f1)
  [ "$focus_line" -gt "$skel_line" ]
}

@test "prompt is not written twice on repeated runs" {
  env FOCUS_UID=1000 FOCUS_PROMPT_STYLE=two-line bash "$ENTRYPOINT" true
  env FOCUS_UID=1000 FOCUS_PROMPT_STYLE=two-line bash "$ENTRYPOINT" true
  count=$(grep -c '# focus-prompt' /home/ubuntu/.bashrc)
  [ "$count" -eq 1 ]
}

@test "prompt is not written when style is off" {
  run env FOCUS_UID=1000 FOCUS_PROMPT_STYLE=off bash "$ENTRYPOINT" true
  [ "$status" -eq 0 ]
  ! grep -q '# focus-prompt' /home/ubuntu/.bashrc 2>/dev/null
}

@test "inline prompt is written to ~/.bashrc" {
  run env FOCUS_UID=1000 FOCUS_PROMPT_STYLE=inline bash "$ENTRYPOINT" true
  [ "$status" -eq 0 ]
  grep -q '# focus-prompt' /home/ubuntu/.bashrc
  # Inline PS1 has no \n before the prompt character; two-line does
  ! grep -qF '\n\$' /home/ubuntu/.bashrc
}

@test "prompt is written after skel .bashrc created by useradd -m" {
  # Use a UID that does not exist in the base image so useradd -m runs and
  # copies /etc/skel (including the default .bashrc with its own PS1).
  rm -rf /home/focususer
  run env FOCUS_UID=1234 FOCUS_PROMPT_STYLE=two-line bash "$ENTRYPOINT" true
  [ "$status" -eq 0 ]
  # The skel .bashrc should have been created and our block appended to it
  grep -q '# focus-prompt' /home/focususer/.bashrc
}

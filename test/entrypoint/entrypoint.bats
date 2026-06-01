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

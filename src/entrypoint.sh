#!/bin/bash
set -e

FOCUS_UID="${FOCUS_UID:-1000}"
FOCUS_VOLUME_HOME="/home/focususer"

if ! getent passwd "$FOCUS_UID" > /dev/null 2>&1; then
    useradd -u "$FOCUS_UID" -m -s /bin/bash focususer 2>/dev/null || true
fi

USERNAME=$(getent passwd "$FOCUS_UID" | cut -d: -f1)
ACTUAL_HOME=$(getent passwd "$FOCUS_UID" | cut -d: -f6)

# The runtime pre-creates the home directory as root in order to host bind-mounted
# volume subdirs (e.g. ~/.claude), so `useradd -m` finds it already present and never
# takes ownership. The result is a home the non-root user cannot write, which blocks
# tools that create dotfiles directly in $HOME (claude writes ~/.claude.json there).
# Give the user its home dir; bind-mounted subdirs keep their own correct ownership,
# so this is intentionally not recursive.
if [ -d "$ACTUAL_HOME" ]; then
    chown "$FOCUS_UID" "$ACTUAL_HOME"
fi

# The workspace volume at /work is also created as root. Without this, the user
# cannot create git worktrees or other directories alongside the project bind-mount.
# Non-recursive: /work/<dirname> is a bind-mount with its own host-derived ownership.
chown "$FOCUS_UID" /work

# Volumes are always mounted under FOCUS_VOLUME_HOME. If the container user's home
# differs (e.g. ubuntu:24.04 maps UID 1000 to 'ubuntu' with home /home/ubuntu),
# symlink each volume directory into the actual home so tools find them at ~/.xxx.
if [ "$ACTUAL_HOME" != "$FOCUS_VOLUME_HOME" ] && [ -d "$FOCUS_VOLUME_HOME" ]; then
    for item in "$FOCUS_VOLUME_HOME"/.[!.]*; do
        [ -e "$item" ] || continue
        name=$(basename "$item")
        [ -e "$ACTUAL_HOME/$name" ] || ln -sf "$item" "$ACTUAL_HOME/$name"
    done
fi

cd "/work/$FOCUS_PROJECT"
git -C "/work/$FOCUS_PROJECT" worktree prune 2>/dev/null || true

if [ "${FOCUS_PROMPT_STYLE:-two-line}" != "off" ]; then
    if ! grep -q '# focus-prompt' "$ACTUAL_HOME/.bashrc" 2>/dev/null; then
        if [ "${FOCUS_PROMPT_STYLE:-two-line}" = "inline" ]; then
            cat >> "$ACTUAL_HOME/.bashrc" << 'EOF'
# focus-prompt
PS1='\[\e[1;32m\][focus]\[\e[0m\] \[\e[0;34m\]\w\[\e[0m\] \$ '
EOF
        else
            cat >> "$ACTUAL_HOME/.bashrc" << 'EOF'
# focus-prompt
PS1='\[\e[1;32m\][focus]\[\e[0m\] \[\e[0;34m\]\w\[\e[0m\]\n\$ '
EOF
        fi
    fi
fi

if [ "$#" -eq 0 ]; then
    exec runuser -u "$USERNAME" -- /bin/bash -i
else
    exec runuser -u "$USERNAME" -- "$@"
fi

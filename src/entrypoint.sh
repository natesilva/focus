#!/bin/bash
set -e

FOCUS_UID="${FOCUS_UID:-1000}"

if ! getent passwd "$FOCUS_UID" > /dev/null 2>&1; then
    useradd -u "$FOCUS_UID" -m -s /bin/bash focususer 2>/dev/null || true
fi

USERNAME=$(getent passwd "$FOCUS_UID" | cut -d: -f1)

cd /focus

if [ "$#" -eq 0 ]; then
    exec runuser -u "$USERNAME" -- /bin/bash -i
else
    exec runuser -u "$USERNAME" -- "$@"
fi

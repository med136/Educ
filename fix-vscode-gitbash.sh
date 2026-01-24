cat > ~/fix-vscode-gitbash.sh << 'EOF'
#!/usr/bin/env bash

# Force Git PATH (early fix)
export GIT_ROOT="/c/Program Files/Git"
export PATH="$GIT_ROOT/usr/bin:$GIT_ROOT/bin:$PATH"

# Debug (optional)
echo "✔ PATH fixed:"
echo "$PATH"

# Launch VS Code
exec "$GIT_ROOT/bin/code" "$@"
EOF

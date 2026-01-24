cat << 'EOF' >> ~/.bashrc

# ==== FIX GIT BASH PATH FOR VS CODE ====
# Force Git core tools (git, sed, which) to be available

GIT_ROOT="/c/Program Files/Git"

if [ -d "$GIT_ROOT/usr/bin" ]; then
  export PATH="$GIT_ROOT/usr/bin:$GIT_ROOT/bin:$PATH"
fi

EOF

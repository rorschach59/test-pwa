#!/usr/bin/env bash
set -euo pipefail

# Bump semver dans le fichier VERSION et injecte dans sw.js
# Usage local: ./bump-sw-version.sh [major|minor|patch]
# Sur Netlify, vous pouvez définir une variable d'env BUMP=patch/minor/major

MODE=${1:-${BUMP:-patch}}

if [ ! -f VERSION ]; then echo "0.0.0" > VERSION; fi
read -r MAJ MIN PAT < <(awk -F. '{print $1,$2,$3}' VERSION)

case "$MODE" in
  major) MAJ=$((MAJ+1)); MIN=0; PAT=0;;
  minor) MIN=$((MIN+1)); PAT=0;;
  patch|*) PAT=$((PAT+1));;
esac

NEW_VERSION="$MAJ.$MIN.$PAT"
echo "$NEW_VERSION" > VERSION

# Injecter dans sw.js (remplacer la ligne const SW_VERSION = 'x.y.z';)
tmpfile=$(mktemp)
sed -E "s/const SW_VERSION = '[^']*';/const SW_VERSION = '${NEW_VERSION}';/" sw.js > "$tmpfile"
mv "$tmpfile" sw.js

echo "SW_VERSION=${NEW_VERSION} injecté dans sw.js"


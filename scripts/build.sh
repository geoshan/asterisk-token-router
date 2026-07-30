#!/bin/bash
# asterisk-token-router build script
# Usage: ./scripts/build.sh [linux|darwin]

set -e
cd "$(dirname "$0")/.."

VERSION=$(cat VERSION 2>/dev/null || echo "0.0.0")
BUILD_TIME=$(date +%m%d.%H%M)
FULL_VERSION="${VERSION} build ${BUILD_TIME}"

TARGET="${1:-linux}"
OUTPUT="asterisk-tr-${TARGET}"

echo "Building ${FULL_VERSION} for ${TARGET}..."

if [ "$TARGET" = "linux" ]; then
  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w -X 'github.com/songquanpeng/one-api/common.Version=${FULL_VERSION}'" \
    -o "${OUTPUT}" .
elif [ "$TARGET" = "darwin" ]; then
  CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 \
    go build -ldflags="-s -w -X 'github.com/songquanpeng/one-api/common.Version=${FULL_VERSION}'" \
    -o "${OUTPUT}" .
else
  echo "Unknown target: ${TARGET}"
  exit 1
fi

ls -lh "${OUTPUT}"
echo "Done: ${FULL_VERSION}"

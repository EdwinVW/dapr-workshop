#!/usr/bin/env bash
set -euo pipefail

docker run -d -p 4000:80 -p 4025:25 --name dtc-maildev maildev/maildev:latest

#!/usr/bin/env bash
set -euo pipefail

basedir=$(dirname $0)

pushd ${basedir}/rabbitmq
./stop-rabbitmq.sh
popd

pushd ${basedir}/mosquitto
./stop-mosquitto.sh
popd

pushd ${basedir}/maildev
./stop-maildev.sh
popd

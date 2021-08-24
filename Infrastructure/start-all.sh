#!/usr/bin/env bash
set -euo pipefail

basedir=$(dirname $0)

pushd ${basedir}/rabbitmq
./start-rabbitmq.sh
popd

pushd ${basedir}/mosquitto
./start-mosquitto.sh
popd

pushd ${basedir}/maildev
./start-maildev.sh
popd


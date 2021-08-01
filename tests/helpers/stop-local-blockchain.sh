#!/bin/bash

pids=$(ps -aux | grep "ganache-cli" | grep -v grep | awk '{split($0,a," "); print a[2] }')

for pid in $pids
do
  kill -9 ${pid} &>/dev/null
done
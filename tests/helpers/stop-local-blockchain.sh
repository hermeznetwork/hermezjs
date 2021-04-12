#!/bin/bash

pid=$(ps -aux | grep "ganache-cli" | grep -v grep | awk '{split($0,a," "); print a[2] }')
if [ ! -z $pid ]; then
  kill -9 ${pid} &>/dev/null
fi
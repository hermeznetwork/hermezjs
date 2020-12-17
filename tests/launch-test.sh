#!/bin/bash

SCRIPT=$(readlink -f "$0")
TEST_HOME=$(dirname "$SCRIPT")
TEST_LOG=${TEST_HOME}/.testlog

rm ${TEST_HOME}/.testlog
NODE_OPTIONS=--experimental-vm-modules npx jest ${TEST_HOME}/hermez-sandbox.test.mjs 2>&1 | tee -a ${TEST_LOG}
for file in ${TEST_HOME}/*.test.mjs; do
        echo $file
	if [[ "$file" != *"hermez-sandbox"* ]]; then
	   NODE_OPTIONS=--experimental-vm-modules API_MODE="MOCK" npx jest $file 2>&1 | tee -a ${TEST_LOG}
	fi

done
passedTest=$(cat ${TEST_LOG} | grep "PASS")
failedTest=$(cat ${TEST_LOG} | grep "FAIL")
echo ""
if [ ! -z "${passedTest}" ]; then
echo -e "PASSED tests :\n${passedTest}"
echo ""
fi
if [ ! -z "${failedTest}" ]; then
echo -e "FAILED tests:\n${failedTest}"
fi


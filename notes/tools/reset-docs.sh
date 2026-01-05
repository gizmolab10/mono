#!/bin/bash
cd ~/GitHub/webseriously
yarn docs:build && yarn docs:dev > ~/GitHub/webseriously/notes/tools/reset-docs-log.txt 2>&1

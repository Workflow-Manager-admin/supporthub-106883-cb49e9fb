#!/bin/bash
cd /home/kavia/workspace/code-generation/supporthub-106883-cb49e9fb/supporthub
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


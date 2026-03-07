#!/bin/bash

# start_all_sites.sh
# Script to start all 8 Project4 Python sites in the background

cd "$(dirname "$0")/Sites" || exit

echo "Starting swarm-command on port 4000..."
cd swarm-command && python3 app.py &
cd ..

echo "Starting freywill on port 4001..."
cd freywill && python3 app.py &
cd ..

echo "Starting compute-rental on port 4002..."
cd compute-rental && python3 app.py &
cd ..

echo "Starting auto-miner on port 4003..."
cd auto-miner && python3 miner.py &
cd ..

echo "Starting hackathon-hosting on port 4004..."
cd hackathon-hosting && python3 app.py &
cd ..

echo "Starting drop-host on port 4005..."
cd drop-host && python3 app.py &
cd ..

echo "Starting x402-shared on port 4006..."
cd x402-shared && python3 app.py &
cd ..

echo "Starting linktree on port 4007..."
cd linktree && python3 app.py &
cd ..

echo "Starting Project 2 Stats App on port 2001..."
cd ../../Project2_JogAndHack/voice-to-text && python3 server.py &
cd ../../Project4-Unwise-Probbably/Sites

echo "Starting Project 3 Just Juggle on port 3001..."
cd ../../Project3_JugglesJules/Database-Auth-Foundation-3 && npm run dev &
cd ../../Project4-Unwise-Probbably/Sites

echo "All sites have been started in the background."
echo "Use 'pkill -f python3' to stop them."

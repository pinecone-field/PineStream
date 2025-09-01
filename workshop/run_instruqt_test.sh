#!/bin/bash

# get the script directory
SCRIPT_DIR=$(dirname "$0")

# get the webapp/.env file
source $SCRIPT_DIR/../webapp/.env

# save current directory
CURRENT_DIR=$(pwd)

cd $SCRIPT_DIR/instruqt

# run the instruqt track test
instruqt track push && \
instruqt track test --runtime-parameters="PINECONE_API_KEY=$PINECONE_API_KEY,GROQ_API_KEY=$GROQ_API_KEY,INSTRUQT_TEST=true"

# go back to the current directory
cd $CURRENT_DIR
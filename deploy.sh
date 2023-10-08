#!/bin/bash

cd ../wherostr-deploy && \
git fetch && git pull && \
rm -rf ./* && \
cp -R ../wherostr/out/* ../wherostr-deploy/ && \
git add . && \
git commit -m "Deploy" && \
git push
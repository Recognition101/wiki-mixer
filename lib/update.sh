#!/usr/bin/env bash

libPath=$(dirname "$0")
rm -rf "$libPath/snabbdom"
cp -r "$libPath/../node_modules/snabbdom/build/package" "$libPath/snabbdom"

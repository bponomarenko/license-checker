#!/usr/bin/env node

const getopts = require('getopts');
const check = require('./lib/checker');

check(getopts(process.argv.slice(2))._[0]);

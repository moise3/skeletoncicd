#!/usr/bin/env node
"use strict";

const program = require('commander')
const create = require('../lib/create')

program
  .command('create')
  .alias('c')
  .description('Command to create repository')

  .action(() => {
    create()
  })

  program.parse(process.argv);
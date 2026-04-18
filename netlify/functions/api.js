const serverless = require('serverless-http');
const express = require('express');
const app = require('../../src/app');

// Wrap the app to strip the function path prefix
const handler = serverless(app, {
  basePath: '/.netlify/functions/api',
});

module.exports.handler = handler;
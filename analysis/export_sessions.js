#!/usr/bin/env node
/**
 *  Reads chrome-storage “piiLogs” values (exported manually as JSON)
 *  and converts to study_data.csv rows compatible with the paper.
 */
const fs = require('fs');
const raw = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

console.log('Participant,Trackers_Base,Trackers_PII,Requests_Base,Requests_PII');

Object.entries(raw).forEach(([pid, obj]) => {
  console.log([
    pid,
    obj.trackersBaseline,
    obj.trackersPII,
    obj.requestsBaseline,
    obj.requestsPII
  ].join(','));
});

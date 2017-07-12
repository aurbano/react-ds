/* globals jasmine */
import 'babel-polyfill';

const reporters = require('jasmine-reporters');
jasmine.VERBOSE = true;
jasmine.getEnv().addReporter(
  new reporters.JUnitXmlReporter({
    savePath: 'test-report',
  })
);

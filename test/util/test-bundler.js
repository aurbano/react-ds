/* globals jasmine */
// needed for regenerator-runtime
// (ES7 generator support is required by redux-saga)
import 'babel-polyfill';
// Enzyme setup for React 16
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

const reporters = require('jasmine-reporters');
jasmine.VERBOSE = true;
jasmine.getEnv().addReporter(
  new reporters.JUnitXmlReporter({
    savePath: 'test-report',
  })
);

configure({ adapter: new Adapter() });

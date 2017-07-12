import React from 'react';
import ReactDOM from 'react-dom';
import './example.css';
import './react-ds.css';
import Examples from './Examples';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Examples />, document.getElementById('root'));
registerServiceWorker();

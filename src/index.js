import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import initializeApp from './initializeApp';
import 'font-awesome/css/font-awesome.css';
import 'reset-css/reset.css';
import './index.css';
import Promise from 'promise-polyfill';

if (!window.Promise) {
  window.Promise = Promise;
}

ReactDOM.render(<App isLoading={true} />, document.getElementById('root'));
initializeApp().then(() => {
  ReactDOM.render(<App isLoading={false} />, document.getElementById('root'));
});
registerServiceWorker();

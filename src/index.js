import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import 'semantic-ui-css/semantic.min.css';

import App from './App';
import * as dotenv from "dotenv";

dotenv.config();

ReactDOM.render(<App />, document.getElementById('root'));
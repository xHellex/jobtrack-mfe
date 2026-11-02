import React from 'react';
import { Provider } from 'react-redux';
import './index.css';
import { store } from './store';
import { Stats } from './Stats';

export default function Root() {
  return (
    <Provider store={store}>
      <div className="jt-stats">
        <Stats />
      </div>
    </Provider>
  );
}

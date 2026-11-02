import React from 'react';
import { Provider } from 'react-redux';
import './index.css';

import { crearStore } from './store';
import { ListaPostulaciones } from './ListaPostulaciones';

const store = crearStore();

export default function Root() {
  return (
    <Provider store={store}>
      <div className="jt-postulaciones">
        <ListaPostulaciones />
      </div>
    </Provider>
  );
}
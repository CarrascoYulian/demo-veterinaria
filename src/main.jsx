import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { StoreProvider } from './store.jsx'
import { loadBaseConfig } from './lib/config.js'
import './index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

loadBaseConfig().then((baseConfig) => {
  root.render(
    <React.StrictMode>
      <StoreProvider baseConfig={baseConfig}>
        <App />
      </StoreProvider>
    </React.StrictMode>,
  )
})

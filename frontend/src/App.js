import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppCliente from './pages/AppCliente';
import Painel from './pages/Painel';
import './App.css';

const SLUG = process.env.REACT_APP_MOTORISTA_SLUG || 'tiago-moraes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${SLUG}`} replace />} />
        <Route path="/:slug" element={<AppCliente />} />
        <Route path="/painel" element={<Painel />} />
      </Routes>
    </BrowserRouter>
  );
}

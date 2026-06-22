import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppCliente from './pages/AppCliente';
import Painel from './pages/Painel';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota do cliente — abre pelo QR Code */}
        <Route path="/:slug" element={<AppCliente />} />
        {/* Painel do motorista */}
        <Route path="/painel" element={<Painel />} />
        <Route path="/" element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Sistema de Agendamento</h2>
            <p>Acesse via QR Code ou <a href="/painel">Painel do Motorista</a></p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

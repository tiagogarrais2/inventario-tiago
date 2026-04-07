"use client";

import React from "react";

export default function Rodape() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-rodape bg-gray-800 text-white py-4 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 text-sm">
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4 text-center">
            <span>
              <strong>Sistema de Inventário v3.2.0</strong> <hr /> Desenvolvido
              por Adm.Tiago das Graças Arrais - IFCE
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              Copyright © {currentYear} - Direitos reservados ao IFCE (INPI)
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/termos-de-uso"
              className="text-gray-200 hover:text-white underline transition-colors"
            >
              Termos de Uso
            </a>
            <span>|</span>
            <a
              href="/politica-de-privacidade"
              className="text-gray-200 hover:text-white underline transition-colors"
            >
              Política de Privacidade
            </a>
            <span>|</span>

            <a
              href="https://github.com/tiagogarrais/inventario-tiago"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              GitHub
            </a>
            <span className="text-gray-400"></span>
          </div>
        </div>
      </div>
    </footer>
  );
}

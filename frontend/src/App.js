import React, { useState } from 'react';
import CameraScan from './CameraScan';

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  const handleCapture = (imageData) => {
    setImage(imageData);
    // Aqui no futuro chamaremos o seu backend server.py
    console.log("Imagem capturada com sucesso!");
    setResult("Analisando planta...");
  };

  return (
    <div className="App" style={{ fontFamily: 'Inter, sans-serif' }}>
      <header style={{ backgroundColor: '#2e7d32', padding: '20px', color: 'white', textAlign: 'center' }}>
        <h1>PlantaScan</h1>
      </header>
      
      <main style={{ padding: '20px' }}>
        {!image ? (
          <div style={{ textAlign: 'center' }}>
            <h2>Bem-vindo ao PlantaScan</h2>
            <p>Aponte a câmera para a planta para receber o diagnóstico.</p>
            <CameraScan onCapture={handleCapture} />
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h3>Resultado da Análise</h3>
            <img src={image} alt="Planta capturada" style={{ width: '100%', maxWidth: '300px', borderRadius: '15px' }} />
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#2e7d32' }}>{result}</p>
            <button 
              onClick={() => setImage(null)}
              style={{ padding: '10px 20px', backgroundColor: '#666', color: 'white', borderRadius: '5px', border: 'none' }}
            >
              Novo Scan
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

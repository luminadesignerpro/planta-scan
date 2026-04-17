import React, { useState } from 'react';
import CameraScan from './CameraScan';

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCapture = async (imageData) => {
    setImage(imageData);
    setLoading(true);

    try {
      // Envia a foto para o servidor Python
      const response = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);
      setResult({ error: "Erro ao conectar com o servidor Python." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', backgroundColor: '#f4f7f4' }}>
      <header style={{ backgroundColor: '#2e7d32', padding: '15px', color: 'white', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0 }}>PlantaScan</h1>
      </header>
      
      <main style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        {!image ? (
          <div style={{ textAlign: 'center' }}>
            <h2>Escanear Planta</h2>
            <p>Posicione a planta no quadro para identificar.</p>
            <CameraScan onCapture={handleCapture} />
          </div>
        ) : (
          <div style={{ textAlign: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
            <img src={image} alt="Captura" style={{ width: '100%', borderRadius: '10px' }} />
            
            {loading ? (
              <p>Analisando com IA...</p>
            ) : result?.error ? (
              <p style={{ color: 'red' }}>{result.error}</p>
            ) : (
              <div style={{ marginTop: '15px', textAlign: 'left' }}>
                <h3 style={{ color: '#2e7d32', margin: '0' }}>{result.nome}</h3>
                <p><strong>Saúde:</strong> {result.saude} ({result.confianca})</p>
                <p><strong>Dicas:</strong> {result.dicas}</p>
              </div>
            )}
            
            <button 
              onClick={() => { setImage(null); setResult(null); }}
              style={{ marginTop: '20px', padding: '12px 25px', backgroundColor: '#666', color: 'white', borderRadius: '50px', border: 'none', cursor: 'pointer' }}
            >
              Novo Escaneamento
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

import React, { useRef, useState } from 'react';

const CameraScan = ({ onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Inicia a câmera do celular
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Usa a câmera traseira
        audio: false,
      });
      videoRef.current.srcObject = stream;
      setIsStreaming(true);
    } catch (err) {
      console.error("Erro ao acessar a câmera: ", err);
      alert("Por favor, permita o acesso à câmera para escanear a planta.");
    }
  };

  // Tira a foto
  const capturePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    onCapture(imageData); // Envia a imagem para a lógica principal
    stopCamera();
  };

  // Para a câmera para economizar bateria
  const stopCamera = () => {
    const stream = videoRef.current.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    setIsStreaming(false);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      {!isStreaming ? (
        <button 
          onClick={startCamera}
          style={{ padding: '15px 30px', backgroundColor: '#2e7d32', color: 'white', borderRadius: '50px', border: 'none', fontSize: '18px', fontWeight: 'bold' }}
        >
          Abrir Câmera 🌿
        </button>
      ) : (
        <div>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '500px', borderRadius: '15px' }} />
          <br />
          <button 
            onClick={capturePhoto}
            style={{ marginTop: '15px', padding: '15px 30px', backgroundColor: '#ff9800', color: 'white', borderRadius: '50px', border: 'none', fontSize: '18px' }}
          >
            Escanear Planta 📸
          </button>
          <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default CameraScan;

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os

app = Flask(__name__)
CORS(app)  # Permite que o frontend acesse o backend

# Rota para receber e analisar a planta
@app.route('/api/scan', methods=['POST'])
def scan_plant():
    try:
        data = request.json
        image_data = data.get('image')

        if not image_data:
            return jsonify({"error": "Nenhuma imagem enviada"}), 400

        # Aqui simulamos a análise da IA
        # No futuro, você integrará seu modelo de visão computacional aqui
        
        # Exemplo de resposta simulada
        resultado = {
            "nome": "Cacto de Teste",
            "saude": "Saudável",
            "confianca": "98%",
            "dicas": "Mantenha em local ensolarado e regue a cada 15 dias."
        }

        return jsonify(resultado)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Porta padrão do backend
    app.run(port=5000, debug=True)

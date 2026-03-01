from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Store Gemini detection results
gemini_results = []

@app.route('/')
def hello_world():
    return jsonify({
        'message': 'Food Detection API',
        'endpoints': [
            'GET /api/gemini-results - Get all Gemini detection results',
            'POST /api/gemini-results - Add new Gemini detection result'
        ]
    })

@app.route('/api/gemini-results', methods=['GET'])
def get_gemini_results():
    """Get all Gemini detection results."""
    return jsonify({
        'success': True,
        'results': gemini_results,
        'count': len(gemini_results)
    })

@app.route('/api/gemini-results', methods=['POST'])
def add_gemini_result():
    """Add a new Gemini detection result."""
    try:
        data = request.get_json()
        
        # Create result entry
        result = {
            'id': f'gemini_{len(gemini_results) + 1}_{int(datetime.now().timestamp())}',
            'timestamp': datetime.now().isoformat(),
            'name': data.get('name', 'Unknown Food'),
            'quality': data.get('quality', 'Unknown'),
            'quantity': data.get('quantity', 'Unknown'),
            'condition': data.get('condition', 'Unknown'),
            'safe_to_eat': data.get('safe_to_eat', 'Unknown'),
            'community_share': data.get('community_share', 'Unknown'),
            'confidence': data.get('confidence', 0.0)
        }
        
        gemini_results.append(result)
        
        return jsonify({
            'success': True,
            'result': result,
            'total_count': len(gemini_results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/test-detection', methods=['POST'])
def add_test_detection():
    """Add a test Gemini detection for demo purposes."""
    test_result = {
        'id': f'test_{len(gemini_results) + 1}_{int(datetime.now().timestamp())}',
        'timestamp': datetime.now().isoformat(),
        'name': 'Apple',
        'quality': 'Fresh',
        'quantity': 'Medium portion (single fruit)',
        'condition': 'Raw, ripe',
        'safe_to_eat': 'Yes, the apple appears to be whole, firm, and free of visible blemishes',
        'community_share': 'Yes, suitable for donation or sharing within the community',
        'confidence': 0.85
    }
    
    gemini_results.append(test_result)
    
    return jsonify({
        'success': True,
        'result': test_result,
        'total_count': len(gemini_results)
    })

if __name__ == '__main__':
    print('Starting Food Detection API server...')
    print('API available at: http://localhost:5000')
    app.run(debug=True, host='0.0.0.0', port=5000)

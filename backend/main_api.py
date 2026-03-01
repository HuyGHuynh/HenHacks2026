#!/usr/bin/env python3
"""
Main Flask API for FreshLoop Application
Integrates cooking assistant and real-time object detection features
"""

import os
import sys
import cv2
import base64
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone
import threading
import time
import json
from PIL import Image
from io import BytesIO
import requests
from dotenv import load_dotenv

# Import our custom modules
from cooking_assistant_fixed import CookingAssistant
from realtime_object_detection import GeminiVisionDetector

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["https://bytemequickly.tech", "http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:8080"])

# Load environment variables
load_dotenv()

# Global instances
cooking_assistant = None
vision_detector = None
latest_results = []
detection_active = False
detection_thread = None

# Initialize services
def initialize_services():
    """Initialize cooking assistant and vision detector"""
    global cooking_assistant, vision_detector
    try:
        cooking_assistant = CookingAssistant()
        vision_detector = GeminiVisionDetector()
        print("✅ Services initialized successfully!")
        return True
    except Exception as e:
        print(f"❌ Error initializing services: {e}")
        return False

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Check if the API is running and services are available"""
    services_status = {
        'cooking_assistant': cooking_assistant is not None,
        'vision_detector': vision_detector is not None,
        'detection_active': detection_active
    }
    
    return jsonify({
        'success': True,
        'message': 'API is running',
        'timestamp': datetime.now().isoformat(),
        'services': services_status
    })

# ==================== COMPUTER VISION ENDPOINTS ====================

@app.route('/api/gemini-results', methods=['GET'])
def get_gemini_results():
    """Get latest Gemini vision detection results"""
    global latest_results
    
    try:
        return jsonify({
            'success': True,
            'results': latest_results,
            'count': len(latest_results),
            'last_updated': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/test-detection', methods=['POST'])
def add_test_detection():
    """Add a test detection result for demo purposes"""
    try:
        test_result = {
            'id': f"test_{int(time.time())}",
            'name': 'Test Apple',
            'quality': 'Fresh',
            'quantity': 'Medium',
            'condition': 'Ripe',
            'safe': 'Yes - looks fresh and healthy',  # Fixed field name
            'community': 'Yes - suitable for sharing',  # Fixed field name
            'confidence': 0.95,
            'timestamp': datetime.now().isoformat(),
            'bbox': [100, 100, 200, 200]
        }
        
        global latest_results
        latest_results.append(test_result)
        
        return jsonify({
            'success': True,
            'message': 'Test detection added',
            'result': test_result
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    """Convert text to speech using ElevenLabs API"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                'success': False,
                'error': 'No text provided'
            }), 400
        
        # Get ElevenLabs API key from environment
        api_key = os.getenv('ELEVENLABS_API_KEY')
        # Use Rachel's voice ID directly for testing
        voice_id = '21m00Tcm4TlvDq8ikWAM'  # Rachel - female voice
        
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'ElevenLabs API key not configured'
            }), 500
        
        # ElevenLabs API endpoint
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": api_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_multilingual_v2",  # Better quality model
            "voice_settings": {
                "stability": 0.75,  # Higher stability for more natural speech
                "similarity_boost": 0.75,  # Higher similarity for more human-like quality
                "style": 0.0,  # Neutral style
                "use_speaker_boost": True  # Enhanced speaker clarity
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # Return audio data as base64
            audio_data = base64.b64encode(response.content).decode('utf-8')
            
            return jsonify({
                'success': True,
                'audio_data': audio_data,
                'content_type': 'audio/mpeg'
            })
        else:
            error_details = response.text if response.text else 'No error details'
            print(f"ElevenLabs API Error {response.status_code}: {error_details}")
            return jsonify({
                'success': False,
                'error': f'ElevenLabs API error: {response.status_code}',
                'details': error_details
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Get available voices from ElevenLabs"""
    try:
        api_key = os.getenv('ELEVENLABS_API_KEY')
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'ElevenLabs API key not configured'
            }), 500
        
        headers = {
            "Accept": "application/json",
            "xi-api-key": api_key
        }
        
        response = requests.get("https://api.elevenlabs.io/v1/voices", headers=headers)
        
        if response.status_code == 200:
            voices_data = response.json()
            return jsonify({
                'success': True,
                'voices': voices_data.get('voices', [])
            })
        else:
            return jsonify({
                'success': False,
                'error': f'ElevenLabs API error: {response.status_code}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analyze-image', methods=['POST'])
def analyze_image():
    """Analyze an uploaded image for food detection"""
    try:
        if not vision_detector:
            return jsonify({
                'success': False,
                'error': 'Vision detector not available'
            }), 503
            
        # Get image from request
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image provided'
            }), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Empty filename'
            }), 400
        
        # Read and process image
        image_bytes = file.read()
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to OpenCV format
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Perform detection
        detections = vision_detector.detect_and_analyze_food(frame)
        
        # Process results
        processed_results = []
        for detection in detections:
            result = {
                'id': f"upload_{int(time.time())}_{len(processed_results)}",
                'name': detection['name'],
                'quality': detection['quality'],
                'quantity': detection['quantity'],
                'condition': detection['condition'],
                'safe': detection['safe'],  # Fixed: use 'safe' not 'safe_to_eat'
                'community': detection['community'],  # Fixed: use 'community' not 'community_share'
                'confidence': detection['confidence'],
                'timestamp': datetime.now().isoformat(),
                'bbox': detection['bbox']
            }
            processed_results.append(result)
            
        # Store results
        global latest_results
        latest_results.extend(processed_results)
        
        # Save to database
        for result in processed_results:
            try:
                capture_info = {'capture_count': 1, 'frame_count': 1}
                vision_detector.save_to_mongodb(result, capture_info)
            except Exception as db_error:
                print(f"Database save error: {db_error}")
        
        return jsonify({
            'success': True,
            'message': f'Found {len(processed_results)} food items',
            'results': processed_results,
            'count': len(processed_results)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/start-detection', methods=['POST'])
def start_camera_detection():
    """Start live camera detection (placeholder for future implementation)"""
    try:
        global detection_active
        
        if detection_active:
            return jsonify({
                'success': False,
                'error': 'Detection already active'
            }), 400
            
        detection_active = True
        
        return jsonify({
            'success': True,
            'message': 'Camera detection started',
            'status': 'active'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stop-detection', methods=['POST'])
def stop_camera_detection():
    """Stop live camera detection"""
    try:
        global detection_active
        detection_active = False
        
        return jsonify({
            'success': True,
            'message': 'Camera detection stopped',
            'status': 'inactive'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== COOKING ASSISTANT ENDPOINTS ====================

@app.route('/api/suggest-recipes', methods=['POST'])
def suggest_recipes():
    """Get recipe suggestions based on available ingredients"""
    try:
        if not cooking_assistant:
            return jsonify({
                'success': False,
                'error': 'Cooking assistant not available'
            }), 503
            
        data = request.get_json()
        if not data or 'ingredients' not in data:
            return jsonify({
                'success': False,
                'error': 'Ingredients list required'
            }), 400
            
        ingredients = data['ingredients']
        if isinstance(ingredients, list):
            ingredients = ', '.join(ingredients)
            
        # Create prompt and get AI response
        prompt = cooking_assistant.create_ingredients_prompt(ingredients)
        response = cooking_assistant.get_gemini_response(prompt)
        
        if not response:
            return jsonify({
                'success': False,
                'error': 'Failed to get recipe suggestions'
            }), 500
            
        # Parse suggested dishes
        dishes = cooking_assistant.parse_dish_suggestions(response)
        
        return jsonify({
            'success': True,
            'ingredients': ingredients,
            'raw_response': response,
            'suggested_dishes': dishes,
            'count': len(dishes)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/get-recipe', methods=['POST'])
def get_recipe():
    """Get detailed recipe for a specific dish"""
    try:
        if not cooking_assistant:
            return jsonify({
                'success': False,
                'error': 'Cooking assistant not available'
            }), 503
            
        data = request.get_json()
        if not data or 'dish_name' not in data:
            return jsonify({
                'success': False,
                'error': 'Dish name required'
            }), 400
            
        dish_name = data['dish_name']
        ingredients = data.get('available_ingredients', '')
        
        # Choose appropriate prompt based on available ingredients
        if ingredients:
            if isinstance(ingredients, list):
                ingredients = ', '.join(ingredients)
            prompt = cooking_assistant.create_selected_dish_prompt(dish_name, ingredients)
        else:
            prompt = cooking_assistant.create_dish_prompt(dish_name)
            
        response = cooking_assistant.get_gemini_response(prompt)
        
        if not response:
            return jsonify({
                'success': False,
                'error': 'Failed to get recipe details'
            }), 500
            
        return jsonify({
            'success': True,
            'dish_name': dish_name,
            'available_ingredients': ingredients,
            'recipe': response
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/cooking-chat', methods=['POST'])
def cooking_chat():
    """General cooking assistance chat endpoint"""
    try:
        if not cooking_assistant:
            return jsonify({
                'success': False,
                'error': 'Cooking assistant not available'
            }), 503
            
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'Message required'
            }), 400
            
        user_message = data['message']
        
        # Create a general cooking assistant prompt
        prompt = f"""You are a helpful cooking assistant. Please help with this cooking question or request: 

{user_message}

Provide practical, clear advice for home cooking. If it's about recipes, include ingredients and steps. If it's about food safety, be specific about guidelines."""
        
        response = cooking_assistant.get_gemini_response(prompt)
        
        if not response:
            return jsonify({
                'success': False,
                'error': 'Failed to get cooking assistance'
            }), 500
            
        return jsonify({
            'success': True,
            'user_message': user_message,
            'assistant_response': response
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== COMBINED FEATURES ====================

@app.route('/api/analyze-and-suggest', methods=['POST'])
def analyze_and_suggest():
    """Analyze uploaded image and suggest recipes based on detected ingredients"""
    try:
        if not vision_detector or not cooking_assistant:
            return jsonify({
                'success': False,
                'error': 'Required services not available'
            }), 503
            
        # Get image from request
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image provided'
            }), 400
            
        file = request.files['image']
        image_bytes = file.read()
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to OpenCV format
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Detect food items
        detections = vision_detector.detect_and_analyze_food(frame)
        
        # Extract fresh/safe ingredients
        fresh_ingredients = []
        for detection in detections:
            if 'fresh' in detection['quality'].lower() or 'yes' in detection['safe'].lower():
                fresh_ingredients.append(detection['name'])
                
        if not fresh_ingredients:
            return jsonify({
                'success': True,
                'message': 'No suitable ingredients found for cooking',
                'detections': detections,
                'suggested_dishes': []
            })
            
        # Get recipe suggestions
        ingredients_str = ', '.join(fresh_ingredients)
        prompt = cooking_assistant.create_ingredients_prompt(ingredients_str)
        recipe_response = cooking_assistant.get_gemini_response(prompt)
        
        suggested_dishes = []
        if recipe_response:
            suggested_dishes = cooking_assistant.parse_dish_suggestions(recipe_response)
            
        return jsonify({
            'success': True,
            'detections': detections,
            'fresh_ingredients': fresh_ingredients,
            'suggested_dishes': suggested_dishes,
            'recipe_response': recipe_response
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== DATA MANAGEMENT ====================

@app.route('/api/clear-results', methods=['POST'])
def clear_results():
    """Clear stored detection results"""
    try:
        global latest_results
        count = len(latest_results)
        latest_results = []
        
        return jsonify({
            'success': True,
            'message': f'Cleared {count} results'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/database-stats', methods=['GET'])
def get_database_stats():
    """Get database statistics"""
    try:
        if not vision_detector or not vision_detector.collection:
            return jsonify({
                'success': False,
                'error': 'Database not available'
            }), 503
            
        # Get collection stats
        doc_count = vision_detector.collection.count_documents({})
        
        # Get recent detections
        recent_docs = list(vision_detector.collection.find({}).sort('timestamp', -1).limit(5))
        
        # Convert ObjectId to string for JSON serialization
        for doc in recent_docs:
            doc['_id'] = str(doc['_id'])
            
        return jsonify({
            'success': True,
            'total_detections': doc_count,
            'database_name': vision_detector.db.name,
            'collection_name': vision_detector.collection.name,
            'recent_detections': recent_docs
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

# ==================== MAIN APPLICATION ====================

def print_endpoints():
    """Print available API endpoints"""
    print("\n" + "="*60)
    print("           FRESHLOOP API ENDPOINTS")
    print("="*60)
    print("\n🖥️  COMPUTER VISION:")
    print("  GET /api/gemini-results          - Get detection results")
    print("  POST /api/test-detection         - Add test detection")
    print("  POST /api/analyze-image          - Analyze uploaded image")
    print("  POST /api/start-detection        - Start camera detection")
    print("  POST /api/stop-detection         - Stop camera detection")
    
    print("\n🍳 COOKING ASSISTANT:")
    print("  POST /api/suggest-recipes        - Get recipe suggestions")
    print("  POST /api/get-recipe            - Get detailed recipe")
    print("  POST /api/cooking-chat          - General cooking assistance")
    
    print("\n🔗 COMBINED FEATURES:")
    print("  POST /api/analyze-and-suggest   - Analyze image + suggest recipes")
    
    print("\n📊 MANAGEMENT:")
    print("  GET /api/health                 - Health check")
    print("  POST /api/clear-results         - Clear detection results")
    print("  GET /api/database-stats         - Database statistics")
    
    print(f"\n🌐 API running at: http://localhost:5000")
    print("="*60)

if __name__ == '__main__':
    print("🚀 Starting FreshLoop API Server...")
    
    # Initialize services
    if initialize_services():
        print_endpoints()
        
        # Start Flask app
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            threaded=True
        )
    else:
        print("❌ Failed to initialize services. Exiting.")
        sys.exit(1)
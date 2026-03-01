#!/usr/bin/env python3
"""
Recipe Community Help Feature
Handles AI-generated help messages for ingredient requests
"""

import os
import google.genai as genai
from flask import Blueprint, request, jsonify
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Blueprint for community help routes
community_help_bp = Blueprint('community_help', __name__)

# ==================== CONFIGURATION ====================

class CommunityHelpConfig:
    """Configuration for Community Help feature"""
    
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_MODEL = 'gemini-flash-latest'  # Using the same model as cooking assistant
    
    SYSTEM_PROMPT = """You are a friendly community cooking assistant.
Your task is to generate short, warm, and polite help messages for a neighborhood food-sharing app.

Rules:
- Keep it under 15 words.
- Sound human and natural.
- Be friendly and appreciative.
- Do not sound robotic.
- Do not add emojis.
- Do not add explanations.
- Only return the message text."""

    @classmethod
    def validate(cls):
        """Validate configuration"""
        if not cls.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        return True

# ==================== MODELS ====================

class HelpRequest:
    """Model for help request data"""
    
    def __init__(self, recipe_name, need_ingredient, have_ingredients, message=None):
        self.recipe_name = recipe_name
        self.need_ingredient = need_ingredient
        self.have_ingredients = have_ingredients
        self.message = message
        self.timestamp = datetime.now().isoformat()
    
    @classmethod
    def from_json(cls, data):
        """Create HelpRequest from JSON data"""
        if not data:
            raise ValueError("No data provided")
        
        recipe_name = data.get('recipe_name', '')
        need_ingredient = data.get('need_ingredient', '')
        have_ingredients = data.get('have_ingredients', [])
        message = data.get('message', None)
        
        if not recipe_name:
            raise ValueError("recipe_name is required")
        if not need_ingredient:
            raise ValueError("need_ingredient is required")
        
        return cls(recipe_name, need_ingredient, have_ingredients, message)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'recipe_name': self.recipe_name,
            'need_ingredient': self.need_ingredient,
            'have_ingredients': self.have_ingredients,
            'message': self.message,
            'timestamp': self.timestamp
        }

class HelpMessage:
    """Model for generated help message"""
    
    def __init__(self, message, request_data):
        self.message = message
        self.request_data = request_data
        self.generated_at = datetime.now().isoformat()
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'message': self.message,
            'request_data': self.request_data.to_dict(),
            'generated_at': self.generated_at
        }

# ==================== SERVICES ====================

class GeminiService:
    """Service for Gemini AI operations"""
    
    def __init__(self):
        """Initialize Gemini service"""
        CommunityHelpConfig.validate()
        self.client = genai.Client(api_key=CommunityHelpConfig.GEMINI_API_KEY)
    
    def generate_help_message(self, help_request):
        """Generate help message using Gemini AI"""
        try:
            # Format ingredients for better readability
            have_ingredients_str = ', '.join(help_request.have_ingredients) if help_request.have_ingredients else 'no ingredients yet'
            
            # Create user prompt with context
            user_prompt = f"""Generate a friendly help request message for:

Recipe I'm making: {help_request.recipe_name}
Ingredient I need: {help_request.need_ingredient}
What I already have: {have_ingredients_str}

Create a natural, conversational message asking neighbors if they can help with the missing ingredient."""

            # Combine system and user prompts
            full_prompt = f"{CommunityHelpConfig.SYSTEM_PROMPT}\n\n{user_prompt}"
            
            # Generate content using new API
            response = self.client.models.generate_content(
                model=CommunityHelpConfig.GEMINI_MODEL,
                contents=full_prompt
            )
            
            if not response or not response.text:
                raise Exception("Empty response from Gemini API")
            
            # Clean up the response
            message = response.text.strip()
            
            # Remove any quotes that might wrap the message
            if message.startswith('"') and message.endswith('"'):
                message = message[1:-1]
            if message.startswith("'") and message.endswith("'"):
                message = message[1:-1]
            
            return message
            
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

class CommunityHelpService:
    """Service for community help operations"""
    
    def __init__(self):
        """Initialize community help service"""
        self.gemini_service = GeminiService()
        self.help_messages = []  # In-memory storage (could be replaced with database)
    
    def generate_message(self, help_request):
        """Generate help message for a request"""
        try:
            message_text = self.gemini_service.generate_help_message(help_request)
            help_message = HelpMessage(message_text, help_request)
            return help_message
        except Exception as e:
            raise Exception(f"Failed to generate message: {str(e)}")
    
    def post_message(self, help_request):
        """Post a help message to the community"""
        try:
            # Store the message (in production, this would save to database)
            self.help_messages.append(help_request.to_dict())
            
            return {
                'success': True,
                'message': 'Help request posted successfully',
                'request_id': len(self.help_messages),
                'timestamp': help_request.timestamp
            }
        except Exception as e:
            raise Exception(f"Failed to post message: {str(e)}")

# Global service instance
community_service = None

def initialize_community_service():
    """Initialize community help service"""
    global community_service
    try:
        community_service = CommunityHelpService()
        print("✅ Community Help service initialized")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize Community Help service: {e}")
        return False

# ==================== ROUTES ====================

@community_help_bp.route('/generate-help-message', methods=['POST'])
def generate_help_message():
    """
    Generate AI-powered help message for ingredient request
    
    Request JSON:
    {
        "recipe_name": "Garlic Butter Chicken",
        "need_ingredient": "2 cups heavy cream",
        "have_ingredients": ["chicken", "garlic", "butter"]
    }
    
    Response JSON:
    {
        "success": true,
        "message": "Generated help message text",
        "request_data": {...},
        "generated_at": "2026-03-01T..."
    }
    """
    try:
        if not community_service:
            return jsonify({
                'success': False,
                'error': 'Community Help service not initialized'
            }), 503
        
        # Parse and validate request
        data = request.get_json()
        help_request = HelpRequest.from_json(data)
        
        # Generate message
        help_message = community_service.generate_message(help_request)
        
        return jsonify({
            'success': True,
            'message': help_message.message,
            'request_data': help_message.request_data.to_dict(),
            'generated_at': help_message.generated_at
        }), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': 'Validation error',
            'details': str(e)
        }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate help message',
            'details': str(e)
        }), 500

@community_help_bp.route('/post-help-message', methods=['POST'])
def post_help_message():
    """
    Post help request message to community
    
    Request JSON:
    {
        "recipe_name": "Garlic Butter Chicken",
        "need_ingredient": "2 cups heavy cream",
        "have_ingredients": ["chicken", "garlic", "butter"],
        "message": "Hi! I'm making Garlic Butter Chicken and need heavy cream..."
    }
    
    Response JSON:
    {
        "success": true,
        "message": "Help request posted successfully",
        "request_id": 1,
        "timestamp": "2026-03-01T..."
    }
    """
    try:
        if not community_service:
            return jsonify({
                'success': False,
                'error': 'Community Help service not initialized'
            }), 503
        
        # Parse and validate request
        data = request.get_json()
        help_request = HelpRequest.from_json(data)
        
        if not help_request.message:
            return jsonify({
                'success': False,
                'error': 'Validation error',
                'details': 'message is required'
            }), 400
        
        # Post message
        result = community_service.post_message(help_request)
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': 'Validation error',
            'details': str(e)
        }), 400
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to post help message',
            'details': str(e)
        }), 500

@community_help_bp.route('/help-messages', methods=['GET'])
def get_help_messages():
    """
    Get all posted help messages (for testing/admin purposes)
    
    Response JSON:
    {
        "success": true,
        "messages": [...],
        "count": 5
    }
    """
    try:
        if not community_service:
            return jsonify({
                'success': False,
                'error': 'Community Help service not initialized'
            }), 503
        
        return jsonify({
            'success': True,
            'messages': community_service.help_messages,
            'count': len(community_service.help_messages)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve messages',
            'details': str(e)
        }), 500

# ==================== EXPORT ====================

__all__ = [
    'community_help_bp',
    'initialize_community_service',
    'CommunityHelpService',
    'GeminiService',
    'HelpRequest',
    'HelpMessage'
]

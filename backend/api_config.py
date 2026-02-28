#!/usr/bin/env python3
"""
API Configuration Utility
Helper functions to load and validate API keys from environment variables.
"""

import os
from dotenv import load_dotenv

def load_api_keys():
    """Load API keys from .env file."""
    load_dotenv()
    
    api_keys = {
        'gemini': os.getenv('GEMINI_API_KEY'),
        'elevenlabs': os.getenv('ELEVENLABS_API_KEY'),
        'elevenlabs_voice_id': os.getenv('ELEVENLABS_VOICE_ID')
    }
    
    return api_keys

def validate_api_keys():
    """Validate that required API keys are present."""
    keys = load_api_keys()
    
    missing_keys = []
    
    if not keys['gemini'] or keys['gemini'] == 'your_gemini_api_key_here':
        missing_keys.append('GEMINI_API_KEY')
    
    if not keys['elevenlabs'] or keys['elevenlabs'] == 'your_elevenlabs_api_key_here':
        missing_keys.append('ELEVENLABS_API_KEY')
    
    if missing_keys:
        print("Missing or invalid API keys:")
        for key in missing_keys:
            print(f"  - {key}")
        print("\nPlease update your .env file with valid API keys.")
        return False
    
    print("All API keys loaded successfully!")
    return True

def get_gemini_client():
    """Initialize and return Gemini client."""
    try:
        import google.generativeai as genai
        keys = load_api_keys()
        
        if not keys['gemini']:
            raise ValueError("Gemini API key not found")
        
        genai.configure(api_key=keys['gemini'])
        model = genai.GenerativeModel('gemini-pro')
        
        print("Gemini client initialized successfully!")
        return model
    
    except ImportError:
        print("Error: google-generativeai not installed. Run: pip install google-generativeai")
        return None
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
        return None

def get_elevenlabs_client():
    """Initialize and return ElevenLabs client."""
    try:
        from elevenlabs import Voice, VoiceSettings, generate
        keys = load_api_keys()
        
        if not keys['elevenlabs']:
            raise ValueError("ElevenLabs API key not found")
        
        os.environ["ELEVEN_API_KEY"] = keys['elevenlabs']
        
        print("ElevenLabs client configured successfully!")
        return True
    
    except ImportError:
        print("Error: elevenlabs not installed. Run: pip install elevenlabs")
        return None
    except Exception as e:
        print(f"Error configuring ElevenLabs client: {e}")
        return None

if __name__ == "__main__":
    print("API Configuration Check")
    print("=" * 30)
    
    # Validate API keys
    if validate_api_keys():
        print("\nTesting API clients...")
        
        # Test Gemini
        gemini_client = get_gemini_client()
        
        # Test ElevenLabs
        elevenlabs_status = get_elevenlabs_client()
        
        print("\nAPI setup complete!")
    else:
        print("\nPlease configure your API keys in the .env file before proceeding.")
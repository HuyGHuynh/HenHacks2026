# Real-time Food Classification with Gemini Vision API and CLI Cooking Assistant

A comprehensive food technology toolkit featuring:
1. **Real-time food detection** using Gemini Vision API and OpenCV
2. **CLI Cooking Assistant** powered by Google Gemini AI

## Projects Included

### 1. Food Detection System
Real-time food detection and classification using Gemini Vision API with webcam integration.

### 2. CLI Cooking Assistant  
An intelligent terminal-based cooking assistant that helps with:
- **Ingredient Mode**: Enter ingredients → Get dish suggestions
- **Recipe Mode**: Enter dish name → Get ingredients and cooking steps

## Features

### Food Detection System:
- **Manual capture food detection** using Gemini Vision API with spacebar trigger
- **Gemini Vision API integration** for food quality analysis
- **On-demand food analysis**: Press spacebar to capture and analyze current frame
- **Intelligent food analysis**: Quality assessment, quantity estimation, condition evaluation
- **Automatic cropping** of detected food objects for analysis 
- **No rate limiting on captures** - analyze every manual capture
- Webcam video capture and display
- Color-coded bounding boxes for different food categories:
  - Orange: Fruits (apple, banana, orange)
  - Green: Vegetables (broccoli, carrot)
  - Red: Prepared foods (sandwich, hot dog, pizza, donut, cake)
  - Magenta: Utensils/containers (cups, bowls, utensils, bottles, cans)
- Class labels with confidence scores
- **Structured food analysis output**:
  - Food quality (Fresh/Average/Poor)
  - Estimated quantity (Small/Medium/Large portion)
  - Visible condition (Ripe/Spoiled/Moldy/Raw/Cooked/etc.)
  - Safety assessment (Safe to eat: Yes/No with reason)
- Console output of food detection results
- Capture statistics display
- Clean exit functionality

### CLI Cooking Assistant:
- Ingredient-to-dish suggestions using AI
- Dish-to-ingredients with cooking instructions
- Powered by Google Gemini 1.5 Flash model
- Clean terminal interface
- Practical, realistic recipe suggestions
- Error handling and input validation

## Food Categories Detected

The system can detect the following food-related items:
- **Fruits**: apple, banana, orange
- **Vegetables**: broccoli, carrot
- **Prepared Foods**: sandwich, hot dog, pizza, donut, cake
- **Utensils/Containers**: wine glass, cup, fork, knife, spoon, bowl, bottle, can

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Set up your API keys:
   - Copy `.env.example` to `.env`
   - Add your actual API keys to the `.env` file:
     - **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
     - **ElevenLabs API Key**: Get from [ElevenLabs Profile](https://elevenlabs.io/profile)

3. Validate your API setup (optional):
```bash
python api_config.py
```

4. Test the enhanced system (optional):
```bash
python test_enhanced_system.py
```

## New Enhanced Features

### Gemini Vision Food Analysis
When you press spacebar to capture and the system detects actual food items (not utensils), it will:
- **Automatically crop** the detected food object from the captured frame
- **Send the image to Gemini Vision API** for detailed analysis
- **Provide structured assessment** including:
  - Food quality (Fresh/Average/Poor)
  - Estimated quantity (Small/Medium/Large portion)  
  - Visible condition (Ripe/Spoiled/Moldy/Raw/Cooked/etc.)
  - Safety assessment with reasoning

### Manual Capture Benefits
- **Control when to analyze** - Only captures when you want it to
- **No API rate limiting** - Every capture is analyzed if food is detected
- **Better performance** - No continuous detection overhead
- **Precise timing** - Capture the perfect moment for analysis
- Only analyzes actual food items (excludes utensils like cups, bowls, forks)

### Example Analysis Output:
```
==================================================
FOOD ANALYSIS: APPLE
==================================================
Food Name: Apple
Quality: Fresh
Estimated Quantity: Medium portion
Visible Condition: Ripe, good color
Safe to Eat: Yes - appears fresh and undamaged
==================================================
```

## Usage

### Food Detection System
1. Run the real-time food detection:
```bash
python realtime_object_detection.py
```

2. The script will:
   - Connect to Gemini Vision API for food detection
   - Open your default camera
   - Show live video feed continuously
   - **Wait for spacebar press to capture and analyze food**
   - **Automatically analyze detected food quality using Gemini Vision API**
   - **Crop detected food objects and send to Gemini for detailed analysis**
   - **Print structured food quality reports to console**
   - Show capture and detection statistics

3. **Controls:**
   - **Press SPACEBAR** to capture current frame and analyze any food
   - **Press 'q'** to quit the application

### CLI Cooking Assistant
1. Run the cooking assistant:
```bash
python cooking_assistant.py
```

2. Choose your mode:
   - **Option 1**: Enter ingredients you have → Get dish suggestions
   - **Option 2**: Enter a dish name → Get ingredients and cooking steps
   - **Option 3**: Quit

3. Follow the prompts to get personalized cooking assistance

#### Example Usage:
```
What would you like to do?
1. I have these ingredients (get dish suggestions)
2. I want to cook this dish (get ingredient list)
3. Quit

Enter your choice (1, 2, or 3): 1
Enter the ingredients you have available:
Your ingredients: chicken, rice, onion, garlic

[AI generates dish suggestions and cooking steps]
```

## Requirements

- Python 3.7 or higher
- A working webcam/camera
- Internet connection (for model download on first run)
- API Keys (optional, for AI integration):
  - Google Gemini API key
  - ElevenLabs API key

## API Configuration

The project includes secure API key management for AI integrations:

- `.env` - Your actual API keys (never commit this file)
- `.env.example` - Template showing the required format
- `api_config.py` - Utility for loading and validating API keys

### Required for Enhanced Food Detection:
- **Google Gemini API key** - Required for food quality analysis in the enhanced detection system

### Required for Cooking Assistant:
- **Google Gemini API key** - Required for the CLI cooking assistant

### Optional for Future Features:
- **ElevenLabs API key** - For potential text-to-speech integration

### Security Notes:
- The `.env` file is automatically ignored by git
- Never share or commit your actual API keys
- Use the `.env.example` as a template for team members

## Troubleshooting

- If camera doesn't open, make sure no other applications are using it
- If model doesn't load, check your internet connection for the initial download
- For better food detection, ensure good lighting and clear view of food items
- The system works best with common food items that are part of the COCO dataset
- For performance issues, try adjusting the confidence threshold in the script
- If API keys aren't loading, ensure your `.env` file is in the project root directory
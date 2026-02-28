#!/usr/bin/env python3
"""
Real-time Food Detection using Gemini Vision API
This script performs food detection and analysis using only Gemini Vision API.
"""

import cv2
import numpy as np
import sys
import os
import time
import base64
from dotenv import load_dotenv
import google.genai as genai
from PIL import Image
import io
import re
import requests
from pymongo import MongoClient
from datetime import datetime, timezone

def get_food_color(food_name):
    """Return color coding for different food types."""
    fruit_colors = (255, 165, 0)  # Orange for fruits
    vegetable_colors = (0, 255, 0)  # Green for vegetables
    prepared_food_colors = (0, 0, 255)  # Red for prepared foods
    utensil_colors = (255, 0, 255)  # Magenta for utensils/containers
    
    fruits = {'apple', 'banana', 'orange'}
    vegetables = {'broccoli', 'carrot', 'celery', 'lettuce'}
    prepared_foods = {'sandwich', 'hot dog', 'pizza', 'donut', 'cake', 'burger'}
    utensils = {'glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'bottle', 'plate'}
    
    food_lower = food_name.lower()
    
    if any(fruit in food_lower for fruit in fruits):
        return fruit_colors
    elif any(veg in food_lower for veg in vegetables):
        return vegetable_colors
    elif any(food in food_lower for food in prepared_foods):
        return prepared_food_colors
    elif any(utensil in food_lower for utensil in utensils):
        return utensil_colors
    else:
        return (128, 128, 128)  # Gray for other food items

class GeminiVisionDetector:
    """Handles Gemini Vision API integration for food detection and analysis."""
    
    def __init__(self):
        """Initialize Gemini client and MongoDB connection."""
        self.client = None
        self.mongo_client = None
        self.db = None
        self.collection = None
        self.setup_gemini()
        self.setup_mongodb()
    
    def setup_gemini(self):
        """Set up Gemini API connection."""
        load_dotenv()
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or api_key == 'your_gemini_api_key_here':
            print("Warning: GEMINI_API_KEY not found. Detection disabled.")
            return
        
        try:
            self.client = genai.Client(api_key=api_key)
            print("Gemini Vision API configured successfully!")
        except Exception as e:
            print(f"Error configuring Gemini API: {e}")
            print("Detection disabled.")
    
    def setup_mongodb(self):
        """Set up MongoDB connection."""
        try:
            # MongoDB connection parameters
            connection_string = "mongodb+srv://doadmin:6H084P5h1ZR9c7YS@db-mongodb-nyc3-54229-ae30f003.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=db-mongodb-nyc3-54229"
            
            # Connect to MongoDB
            self.mongo_client = MongoClient(connection_string)
            self.db = self.mongo_client['food_detection_db']  # Use specific database name
            self.collection = self.db['food_detections']
            
            # Test connection and print database info
            self.mongo_client.admin.command('ping')
            print("MongoDB connected successfully!")
            
            # Print database and collection info
            print(f"Using database: {self.db.name}")
            print(f"Using collection: {self.collection.name}")
            
            # Check existing documents count
            doc_count = self.collection.count_documents({})
            print(f"Current documents in collection: {doc_count}")
            
        except Exception as e:
            print(f"Error connecting to MongoDB: {e}")
            print("Database saving disabled.")
    
    def send_to_web_api(self, detection_data):
        """Send detection results to Flask web API."""
        try:
            # Prepare data for web API
            api_data = {
                'name': detection_data['name'],
                'quality': detection_data['quality'],
                'quantity': detection_data['quantity'], 
                'condition': detection_data['condition'],
                'safe_to_eat': detection_data['safe'],
                'community_share': detection_data['community'],
                'confidence': detection_data['confidence']
            }
            
            # Send to web API
            response = requests.post('http://localhost:5000/api/gemini-results', 
                                   json=api_data, timeout=5)
            
            if response.status_code == 200:
                print("✅ Results sent to web interface!")
                return True
            else:
                print(f"⚠️ Web API error: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Failed to send to web API: {e}")
            return False
        except Exception as e:
            print(f"⚠️ Unexpected error sending to web: {e}")
            return False
    
    def save_to_mongodb(self, detection_data, capture_info):
        """Save detection data to MongoDB."""
        if self.mongo_client is None or self.collection is None:
            return False
        
        try:
            # Prepare document for MongoDB
            document = {
                'timestamp': datetime.now(timezone.utc),
                'capture_number': capture_info['capture_count'],
                'frame_number': capture_info['frame_count'],
                'detection': {
                    'name': detection_data['name'],
                    'confidence': detection_data['confidence'],
                    'quality': detection_data['quality'],
                    'quantity': detection_data['quantity'],
                    'condition': detection_data['condition'],
                    'safe_to_eat': detection_data['safe'],
                    'community_share': detection_data['community'],
                    'bbox_coordinates': {
                        'x1': detection_data['bbox'][0],
                        'y1': detection_data['bbox'][1],
                        'x2': detection_data['bbox'][2],
                        'y2': detection_data['bbox'][3]
                    }
                },
                'system_info': {
                    'detector_type': 'gemini_vision',
                    'model': 'gemini-2.5-flash'
                }
            }
            
            # Insert document
            result = self.collection.insert_one(document)
            print(f"✓ Saved to MongoDB with ID: {result.inserted_id}")
            
            # Verify insertion by checking document count
            new_count = self.collection.count_documents({})
            print(f"Total documents now: {new_count}")
            
            # Verify the document was actually inserted
            inserted_doc = self.collection.find_one({'_id': result.inserted_id})
            if inserted_doc:
                print(f"✓ Verified: Document exists in database")
                print(f"Food item: {inserted_doc['detection']['name']}")
            else:
                print("✗ Warning: Document not found after insertion")
            
            return True
            
        except Exception as e:
            print(f"Error saving to MongoDB: {e}")
            return False
    
    def encode_image(self, image_array):
        """Convert image array to base64 string."""
        try:
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            
            # Convert to PIL Image
            pil_image = Image.fromarray(image_rgb)
            
            # Convert to bytes
            buffer = io.BytesIO()
            pil_image.save(buffer, format='JPEG')
            image_bytes = buffer.getvalue()
            
            # Encode to base64
            base64_string = base64.b64encode(image_bytes).decode('utf-8')
            return base64_string
        except Exception as e:
            print(f"Error encoding image: {e}")
            return None
    
    def detect_and_analyze_food(self, frame):
        """Detect and analyze food items in the entire frame using Gemini Vision."""
        if not self.client:
            return []
        
        try:
            base64_image = self.encode_image(frame)
            if not base64_image:
                return []
            
            # Create comprehensive prompt for detection and analysis
            prompt = """You are a food quality inspector with computer vision capabilities. 
            
Analyze this image and detect ALL food items, beverages, and food-related objects visible.
            
For EACH item you detect, provide:
            1. Item Name: [specific name]
            2. Position: [describe where in image - left/center/right, top/middle/bottom]
            3. Quality: [Fresh/Average/Poor]
            4. Quantity: [Small/Medium/Large portion]
            5. Condition: [Ripe/Raw/Cooked/Spoiled/Moldy/etc.]
            6. Safe to Eat: [Yes/No with reason]
            7. Community Share: [Yes/No - suitable for sharing/donating to community]
            
Format each detection as:
            ITEM: [name]
            POSITION: [location description]
            QUALITY: [quality]
            QUANTITY: [quantity]
            CONDITION: [condition]
            SAFE: [yes/no with reason]
            COMMUNITY: [yes/no with reason]
            ---
            
If no food items are visible, respond with: "No food items detected."
            
Be thorough and detect everything edible or food-related in the image."""
            
            # Send to Gemini Vision
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": base64_image
                                }
                            }
                        ]
                    }
                ]
            )
            
            return self.parse_detection_response(response.text, frame.shape)
            
        except Exception as e:
            print(f"Error detecting food with Gemini: {e}")
            return []
    
    def parse_detection_response(self, response_text, frame_shape):
        """Parse Gemini's detection response and create bounding box data."""
        detections = []
        
        if "No food items detected" in response_text:
            return detections
        
        # Split response into individual items
        items = response_text.split('---')
        
        height, width = frame_shape[:2]
        
        for i, item in enumerate(items):
            if not item.strip():
                continue
                
            try:
                # Extract item name
                item_match = re.search(r'ITEM:\s*(.+?)\n', item)
                if not item_match:
                    continue
                
                item_name = item_match.group(1).strip()
                
                # Extract position to estimate bounding box
                position_match = re.search(r'POSITION:\s*(.+?)\n', item)
                position = position_match.group(1).lower() if position_match else "center middle"
                
                # Create estimated bounding box based on position description
                bbox = self.estimate_bounding_box(position, width, height, len(detections))
                
                # Extract other information
                quality_match = re.search(r'QUALITY:\s*(.+?)\n', item)
                quantity_match = re.search(r'QUANTITY:\s*(.+?)\n', item)
                condition_match = re.search(r'CONDITION:\s*(.+?)\n', item)
                safe_match = re.search(r'SAFE:\s*(.+?)\n', item)
                community_match = re.search(r'COMMUNITY:\s*(.+?)(?:\n|$)', item)
                
                detection_data = {
                    'name': item_name,
                    'bbox': bbox,
                    'confidence': 0.85,  # Simulated confidence
                    'quality': quality_match.group(1).strip() if quality_match else "Unknown",
                    'quantity': quantity_match.group(1).strip() if quantity_match else "Unknown",
                    'condition': condition_match.group(1).strip() if condition_match else "Unknown",
                    'safe': safe_match.group(1).strip() if safe_match else "Unknown",
                    'community': community_match.group(1).strip() if community_match else "Unknown"
                }
                
                detections.append(detection_data)
                
            except Exception as e:
                print(f"Error parsing detection item: {e}")
                continue
        
        return detections
    
    def estimate_bounding_box(self, position_desc, width, height, item_index):
        """Estimate bounding box coordinates based on position description."""
        # Default box size (adjust as needed)
        box_w, box_h = width // 4, height // 4
        
        # Parse position description
        x_center, y_center = width // 2, height // 2  # Default to center
        
        if "left" in position_desc:
            x_center = width // 4
        elif "right" in position_desc:
            x_center = 3 * width // 4
        
        if "top" in position_desc:
            y_center = height // 4
        elif "bottom" in position_desc:
            y_center = 3 * height // 4
        
        # Add some offset for multiple items to avoid overlap
        offset = item_index * 20
        x_center += offset
        y_center += offset
        
        # Calculate bounding box
        x1 = max(0, x_center - box_w // 2)
        y1 = max(0, y_center - box_h // 2)
        x2 = min(width, x_center + box_w // 2)
        y2 = min(height, y_center + box_h // 2)
        
        return [x1, y1, x2, y2]
    
    def print_analysis(self, detection_data):
        """Print formatted analysis results."""
        print("\n" + "="*50)
        print(f"FOOD ANALYSIS: {detection_data['name'].upper()}")
        print("="*50)
        print(f"Quality: {detection_data['quality']}")
        print(f"Quantity: {detection_data['quantity']}")
        print(f"Condition: {detection_data['condition']}")
        print(f"Safe to Eat: {detection_data['safe']}")
        print(f"Community Share: {detection_data['community']}")
        print("="*50)

def main():
    """Main function to run Gemini-based food detection and analysis."""
    
    print("Gemini Vision Food Detection System")
    print("This system uses only Gemini Vision API for detection and analysis")
    
    # Initialize Gemini detector
    print("Initializing Gemini Vision detector...")
    detector = GeminiVisionDetector()
    
    # Initialize webcam
    print("Initializing camera...")
    cap = cv2.VideoCapture(0)  # Use default camera (index 0)
    
    if not cap.isOpened():
        print("Error: Could not open camera")
        sys.exit(1)
    
    # Set camera properties for better performance
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 480)   # Reduced resolution for speed
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 360)  # Reduced resolution for speed
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)      # Reduce buffer for real-time
    
    print("Camera initialized successfully!")
    print("Press SPACEBAR to capture and analyze food")
    print("Press 'q' to quit")
    print("Looking for food items...")
    print("-" * 50)
    
    frame_count = 0
    food_detected_count = 0
    capture_count = 0
    last_detections = []
    detection_display_time = 5.0  # Show boxes for 5 seconds
    last_detection_time = 0
    
    try:
        while True:
            # Capture frame from camera
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame from camera")
                break
            
            frame_count += 1
            
            # Check for key press
            key = cv2.waitKey(1) & 0xFF
            
            # Only perform detection when spacebar is pressed
            if key == ord(' '):  # Spacebar pressed
                capture_count += 1
                print(f"\n--- CAPTURE {capture_count} ---")
                print("Analyzing frame with Gemini Vision...")
                
                # Detect and analyze food using Gemini Vision
                detections = detector.detect_and_analyze_food(frame)
                
                # Process detection results
                food_detections = []
                if detections:
                    for detection in detections:
                        food_detections.append((
                            detection['bbox'], 
                            detection['confidence'], 
                            detection['name']
                        ))
                        
                        # Print detection to console
                        print(f"Found {detection['name']} (confidence: {detection['confidence']:.2f})")
                        
                        # Print detailed analysis
                        detector.print_analysis(detection)
                        
                        # Ask user if they want to save to database
                        save_choice = input("\nSave this detection to database? (y/n): ").strip().lower()
                        
                        if save_choice in ['y', 'yes', '1']:
                            # Save to MongoDB
                            capture_info = {
                                'capture_count': capture_count,
                                'frame_count': frame_count
                            }
                            detector.save_to_mongodb(detection, capture_info)
                            
                            # Also send to web API
                            detector.send_to_web_api(detection)
                        else:
                            print("✓ Detection not saved to database")
                        
                        food_detected_count += len(detections)
                
                if food_detections:
                    print(f"Capture {capture_count}: Found {len(food_detections)} food items")
                    # Store detections for display
                    last_detections = food_detections.copy()
                    last_detection_time = time.time()
                else:
                    print(f"Capture {capture_count}: No food items detected")
                print("-" * 30)
            
            # Draw persistent bounding boxes from last detection
            current_time = time.time()
            if last_detections and (current_time - last_detection_time) < detection_display_time:
                for box, conf, class_name in last_detections:
                    x1, y1, x2, y2 = map(int, box)
                    color = get_food_color(class_name)
                    
                    # Draw bounding box
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 3)
                    
                    # Prepare label text
                    label = f"FOOD: {class_name.upper()} ({conf:.2f})"
                    
                    # Get label size for background rectangle
                    (label_width, label_height), baseline = cv2.getTextSize(
                        label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2
                    )
                    
                    # Draw label background
                    cv2.rectangle(
                        frame,
                        (x1, y1 - label_height - baseline - 10),
                        (x1 + label_width + 10, y1),
                        color,
                        -1
                    )
                    
                    # Draw label text
                    cv2.putText(
                        frame,
                        label,
                        (x1 + 5, y1 - baseline - 5),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (255, 255, 255),
                        2
                    )
            elif last_detections and (current_time - last_detection_time) >= detection_display_time:
                # Clear old detections
                last_detections = []
            
            # Add status information to frame
            cv2.putText(
                frame,
                f"Frame: {frame_count} | Captures: {capture_count} | Total Detections: {food_detected_count}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )
            
            cv2.putText(
                frame,
                "Press SPACEBAR to capture | Press 'q' to quit",
                (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2
            )
            
            # Show time remaining for current detections
            if last_detections:
                time_remaining = detection_display_time - (current_time - last_detection_time)
                if time_remaining > 0:
                    cv2.putText(
                        frame,
                        f"Showing detections: {time_remaining:.1f}s remaining",
                        (10, 90),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0, 255, 255),
                        2
                    )
            
            # Display the frame
            cv2.imshow('Gemini Vision Food Detection - Press SPACEBAR to Analyze', frame)
            
            # Check for 'q' key press to exit
            if key == ord('q'):
                print("Exiting...")
                break
                
    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Clean up resources
        print("Releasing camera and closing windows...")
        cap.release()
        cv2.destroyAllWindows()
        
        # Close MongoDB connection
        if detector.mongo_client is not None:
            detector.mongo_client.close()
            print("MongoDB connection closed.")
        
        print("Cleanup completed successfully!")

if __name__ == "__main__":
    main()
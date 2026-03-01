#!/usr/bin/env python3
"""
CLI Cooking Assistant using Google Gemini API
A terminal-based cooking assistant that suggests dishes from ingredients or ingredients from dishes.
"""

import os
import sys
from dotenv import load_dotenv
import google.genai as genai

class CookingAssistant:
    def __init__(self):
        """Initialize the cooking assistant with Gemini API."""
        self.client = None
        self.setup_api()
    
    def setup_api(self):
        """Set up Gemini API connection."""
        load_dotenv()
        
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key or api_key == 'your_gemini_api_key_here':
            print("Error: GEMINI_API_KEY not found or not configured.")
            print("Please set your Gemini API key in the .env file.")
            sys.exit(1)
        
        try:
            # Initialize the client with API key
            self.client = genai.Client(api_key=api_key)
            print("Gemini API configured successfully!")
        except Exception as e:
            print(f"Error configuring Gemini API: {e}")
            sys.exit(1)
    
    def create_ingredients_prompt(self, ingredients):
        """Create a prompt for ingredient-to-dish suggestions."""
        system_instruction = """You are a professional home chef assistant. Suggest practical, realistic meals using common household ingredients. Avoid rare or expensive ingredients unless necessary. Keep responses concise and structured."""
        
        prompt = f"""{system_instruction}

I have these ingredients: {ingredients}

Please suggest 4-5 dishes I can make with these ingredients. Format your response as follows:

SUGGESTED DISHES:
1. [Dish Name]: Brief description
2. [Dish Name]: Brief description
3. [Dish Name]: Brief description
4. [Dish Name]: Brief description
5. [Dish Name]: Brief description

Keep suggestions realistic and use ingredients that are commonly available. Focus on dishes that don't require many additional ingredients. Only provide the dish names and descriptions, no cooking steps yet."""
        
        return prompt
    
    def create_dish_prompt(self, dish_name):
        """Create a prompt for dish-to-ingredients suggestions."""
        system_instruction = """You are a professional home chef assistant. Provide ingredient lists and cooking instructions for common dishes. Use practical, accessible ingredients and keep instructions concise."""
        
        prompt = f"""{system_instruction}

I want to cook: {dish_name}

Please provide the following information:

INGREDIENTS NEEDED:
List the main ingredients required (keep it simple and realistic)

COOKING STEPS:
Provide 5-7 clear, concise cooking steps

Focus on a home-kitchen friendly version of this dish using common ingredients."""
        
        return prompt
    
    def create_selected_dish_prompt(self, dish_name, ingredients):
        """Create a prompt for detailed cooking steps of selected dish."""
        system_instruction = """You are a professional home chef assistant. Provide detailed, practical cooking instructions for home cooks. Focus on clear steps and realistic techniques."""
        
        prompt = f"""{system_instruction}

I want to cook: {dish_name}
Using ingredients I have: {ingredients}

Please provide detailed cooking instructions:

INGREDIENTS NEEDED:
List the main ingredients required (prioritize the ones I already have)

COOKING STEPS:
Provide 6-8 clear, detailed cooking steps with timing and techniques

COOKING TIPS:
Add 2-3 helpful tips for best results

Focus on a practical home-kitchen version using the ingredients I have available."""
        
        return prompt
    
    def parse_dish_suggestions(self, response_text):
        """Extract dish names from the AI response."""
        dishes = []
        lines = response_text.split('\n')
        
        for line in lines:
            # Look for numbered dishes like "1. Dish Name: description"
            if line.strip() and any(line.strip().startswith(f"{i}.") for i in range(1, 10)):
                # Extract just the dish name (everything between number and colon)
                try:
                    dish_part = line.split(':')[0]  # Get part before colon
                    dish_name = dish_part.split('.', 1)[1].strip()  # Remove number
                    dishes.append(dish_name)
                except:
                    pass
        
        return dishes
    
    def select_dish_from_suggestions(self, dishes):
        """Allow user to select a dish from suggestions."""
        if not dishes:
            print("No dishes found to select from.")
            return None
            
        print("\n" + "="*50)
        print("SELECT A DISH FOR DETAILED COOKING STEPS")
        print("="*50)
        
        for i, dish in enumerate(dishes, 1):
            print(f"{i}. {dish}")
        print(f"{len(dishes) + 1}. Return to main menu")
        
        while True:
            try:
                choice = input(f"\nSelect a dish (1-{len(dishes) + 1}): ").strip()
                
                if choice.lower() in ['quit', 'exit', 'q']:
                    return None
                    
                choice_num = int(choice)
                
                if 1 <= choice_num <= len(dishes):
                    selected_dish = dishes[choice_num - 1]
                    print(f"\nYou selected: {selected_dish}")
                    return selected_dish
                elif choice_num == len(dishes) + 1:
                    return None
                else:
                    print(f"Please enter a number between 1 and {len(dishes) + 1}")
                    
            except ValueError:
                print("Please enter a valid number")
            except KeyboardInterrupt:
                print("\nReturning to main menu...")
                return None
    
    def get_gemini_response(self, prompt):
        """Get response from Gemini AI."""
        try:
            # Use the latest Gemini Flash model
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',  # Use latest available model
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Error getting response from Gemini: {e}")
            # Try alternative model
            try:
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                return response.text
            except Exception as e2:
                print(f"Backup method also failed: {e2}")
                return None
    
    def format_output(self, response):
        """Format and display the response nicely."""
        if not response:
            print("Sorry, I couldn't generate a response. Please try again.")
            return
        
        print("\n" + "="*60)
        print(response)
        print("="*60)
    
    def get_user_choice(self):
        """Get user's choice of operation mode."""
        print("\nWhat would you like to do?")
        print("1. I have these ingredients (get dish suggestions)")
        print("2. I want to cook this dish (get ingredient list)")
        print("3. Quit")
        
        while True:
            try:
                choice = input("\nEnter your choice (1, 2, or 3): ").strip()
                if choice in ['1', '2', '3']:
                    return int(choice)
                else:
                    print("Please enter 1, 2, or 3.")
            except KeyboardInterrupt:
                print("\nGoodbye!")
                sys.exit(0)
            except Exception:
                print("Invalid input. Please enter 1, 2, or 3.")
    
    def get_ingredients(self):
        """Get ingredients list from user."""
        print("\nEnter the ingredients you have available:")
        print("(Separate multiple ingredients with commas)")
        
        while True:
            try:
                ingredients = input("Your ingredients: ").strip()
                if ingredients:
                    return ingredients
                else:
                    print("Please enter at least one ingredient.")
            except KeyboardInterrupt:
                print("\nReturning to main menu...")
                return None
    
    def get_dish_name(self):
        """Get dish name from user."""
        print("\nEnter the name of the dish you want to cook:")
        
        while True:
            try:
                dish = input("Dish name: ").strip()
                if dish:
                    return dish
                else:
                    print("Please enter a dish name.")
            except KeyboardInterrupt:
                print("\nReturning to main menu...")
                return None
    
    def run(self):
        """Main application loop."""
        print("="*60)
        print("           CLI COOKING ASSISTANT")
        print("         Powered by Google Gemini")
        print("="*60)
        print("Welcome! I can help you with cooking based on ingredients or dishes.")
        
        while True:
            try:
                choice = self.get_user_choice()
                
                if choice == 1:
                    # Ingredients to dishes mode
                    ingredients = self.get_ingredients()
                    if ingredients:
                        print(f"\nLooking up dishes for: {ingredients}")
                        print("Please wait...")
                        
                        # Get dish suggestions
                        prompt = self.create_ingredients_prompt(ingredients)
                        response = self.get_gemini_response(prompt)
                        
                        if response:
                            self.format_output(response)
                            
                            # Parse dish suggestions and let user select one
                            dishes = self.parse_dish_suggestions(response)
                            
                            if dishes:
                                selected_dish = self.select_dish_from_suggestions(dishes)
                                
                                if selected_dish:
                                    print(f"\nGetting detailed cooking steps for: {selected_dish}")
                                    print("Please wait...")
                                    
                                    # Get detailed cooking steps for selected dish
                                    detail_prompt = self.create_selected_dish_prompt(selected_dish, ingredients)
                                    detail_response = self.get_gemini_response(detail_prompt)
                                    
                                    if detail_response:
                                        print("\n" + "="*60)
                                        print(f"DETAILED COOKING GUIDE: {selected_dish.upper()}")
                                        print("="*60)
                                        self.format_output(detail_response)
                
                elif choice == 2:
                    # Dish to ingredients mode
                    dish_name = self.get_dish_name()
                    if dish_name:
                        print(f"\nLooking up recipe for: {dish_name}")
                        print("Please wait...")
                        
                        prompt = self.create_dish_prompt(dish_name)
                        response = self.get_gemini_response(prompt)
                        self.format_output(response)
                
                elif choice == 3:
                    print("\nThank you for using the Cooking Assistant!")
                    print("Happy cooking!")
                    break
            
            except KeyboardInterrupt:
                print("\n\nThank you for using the Cooking Assistant!")
                print("Happy cooking!")
                break
            except Exception as e:
                print(f"\nAn unexpected error occurred: {e}")
                print("Please try again.")

def main():
    """Main function to run the cooking assistant."""
    try:
        assistant = CookingAssistant()
        assistant.run()
    except KeyboardInterrupt:
        print("\nGoodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"Failed to start cooking assistant: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
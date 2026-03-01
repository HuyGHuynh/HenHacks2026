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
        """Create a prompt for ingredient-to-dish suggestions with detailed recipes."""
        system_instruction = """You are a professional home chef assistant. Suggest practical, realistic meals using common household ingredients. Avoid rare or expensive ingredients unless necessary. Provide both suggestions AND detailed cooking instructions."""
        
        prompt = f"""{system_instruction}

I have these ingredients: {ingredients}

Please suggest 4-5 dishes I can make with these ingredients. For EACH dish, provide both a brief description AND complete cooking instructions.

Format your response EXACTLY as follows:

SUGGESTED DISHES:

==DISH 1==
Name: [Dish Name]
Description: [Brief description]
Ingredients: [Complete ingredient list]
Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]
[Continue with all steps]
Tips: [2-3 helpful cooking tips]

==DISH 2==
Name: [Dish Name]
Description: [Brief description]
Ingredients: [Complete ingredient list]
Steps:
1. [Step 1]
2. [Step 2]
[Continue with all steps]
Tips: [2-3 helpful cooking tips]

[Continue for all dishes...]

Keep suggestions realistic and use ingredients that are commonly available. Focus on dishes that don't require many additional ingredients. Provide complete cooking instructions for each dish."""
        
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
    
    def parse_dish_suggestions_with_recipes(self, response_text):
        """Extract dish names and their complete recipes from AI response."""
        dishes = []
        recipes = {}
        
        # Split response by dish sections
        sections = response_text.split('==DISH')
        
        for i, section in enumerate(sections):
            if i == 0:  # Skip the intro text
                continue
                
            try:
                # Parse each dish section
                lines = section.strip().split('\n')
                dish_name = None
                description = None
                ingredients = None
                steps = []
                tips = None
                
                current_section = None
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                        
                    if line.startswith('Name:'):
                        dish_name = line.replace('Name:', '').strip()
                    elif line.startswith('Description:'):
                        description = line.replace('Description:', '').strip()
                    elif line.startswith('Ingredients:'):
                        ingredients = line.replace('Ingredients:', '').strip()
                    elif line.startswith('Steps:'):
                        current_section = 'steps'
                    elif line.startswith('Tips:'):
                        tips = line.replace('Tips:', '').strip()
                        current_section = None
                    elif current_section == 'steps' and (line.startswith(tuple('123456789')) or line.startswith('-')):
                        step = line.lstrip('0123456789.- ').strip()
                        if step:
                            steps.append(step)
                
                # Store the parsed dish and recipe
                if dish_name:
                    dishes.append(dish_name)
                    recipes[dish_name] = {
                        'name': dish_name,
                        'description': description or 'A delicious homemade dish',
                        'ingredients': ingredients or 'See recipe details',
                        'steps': steps if steps else ['Follow standard cooking methods for this dish'],
                        'tips': tips or 'Cook with care and taste as you go'
                    }
                    
            except Exception as e:
                print(f"Error parsing dish section: {e}")
                continue
        
        # Fallback if parsing fails completely
        if not dishes:
            print("Parsing failed, using fallback method...")
            dishes, recipes = self.fallback_parse_dishes(response_text)
        
        return dishes, recipes
    
    def fallback_parse_dishes(self, response_text):
        """Fallback parsing method if structured parsing fails."""
        dishes = []
        recipes = {}
        lines = response_text.split('\n')
        
        for line in lines:
            # Look for numbered dishes like "1. Dish Name: description"
            if line.strip() and any(line.strip().startswith(f"{i}.") for i in range(1, 10)):
                try:
                    dish_part = line.split(':')[0]  # Get part before colon
                    dish_name = dish_part.split('.', 1)[1].strip()  # Remove number
                    description = ':'.join(line.split(':')[1:]).strip() if ':' in line else 'A delicious homemade dish'
                    
                    dishes.append(dish_name)
                    recipes[dish_name] = {
                        'name': dish_name,
                        'description': description,
                        'ingredients': 'Basic ingredients as mentioned',
                        'steps': ['Prepare ingredients', 'Cook according to standard methods', 'Season and serve'],
                        'tips': 'Follow basic cooking principles'
                    }
                except:
                    pass
        
        return dishes, recipes
    
    def select_dish_from_suggestions(self, dishes, recipes):
        """Allow user to select a dish and return its recipe."""
        if not dishes:
            print("No dishes found to select from.")
            return None, None
            
        print("\n" + "="*50)
        print("SELECT A DISH FOR DETAILED COOKING STEPS")
        print("="*50)
        
        for i, dish in enumerate(dishes, 1):
            description = recipes.get(dish, {}).get('description', '')
            print(f"{i}. {dish}")
            if description:
                print(f"   {description}")
        print(f"{len(dishes) + 1}. Return to main menu")
        
        while True:
            try:
                choice = input(f"\nSelect a dish (1-{len(dishes) + 1}): ").strip()
                
                if choice.lower() in ['quit', 'exit', 'q']:
                    return None, None
                    
                choice_num = int(choice)
                
                if 1 <= choice_num <= len(dishes):
                    selected_dish = dishes[choice_num - 1]
                    selected_recipe = recipes.get(selected_dish)
                    print(f"\nYou selected: {selected_dish}")
                    return selected_dish, selected_recipe
                elif choice_num == len(dishes) + 1:
                    return None, None
                else:
                    print(f"Please enter a number between 1 and {len(dishes) + 1}")
                    
            except ValueError:
                print("Please enter a valid number")
            except KeyboardInterrupt:
                print("\nReturning to main menu...")
                return None, None
    
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
                    # Ingredients to dishes mode - SINGLE API CALL
                    ingredients = self.get_ingredients()
                    if ingredients:
                        print(f"\nLooking up dishes for: {ingredients}")
                        print("Please wait...")
                        
                        # Get dish suggestions AND detailed recipes in ONE call
                        prompt = self.create_ingredients_prompt(ingredients)
                        response = self.get_gemini_response(prompt)
                        
                        if response:
                            # Parse both suggestions and recipes from single response
                            dishes, recipes = self.parse_dish_suggestions_with_recipes(response)
                            
                            if dishes:
                                # Display suggestions
                                print("\n" + "="*60)
                                print(f"FOUND {len(dishes)} DISHES FOR YOUR INGREDIENTS")
                                print("="*60)
                                
                                for i, dish in enumerate(dishes, 1):
                                    recipe = recipes.get(dish, {})
                                    print(f"\n{i}. {dish}")
                                    print(f"   Description: {recipe.get('description', 'A delicious dish')}")
                                
                                # Let user select and show detailed recipe (already fetched!)
                                selected_dish, selected_recipe = self.select_dish_from_suggestions(dishes, recipes)
                                
                                if selected_dish and selected_recipe:
                                    print("\n" + "="*60)
                                    print(f"DETAILED COOKING GUIDE: {selected_dish.upper()}")
                                    print("="*60)
                                    
                                    print(f"\n📝 INGREDIENTS:")
                                    print(f"   {selected_recipe.get('ingredients', 'See steps below')}")
                                    
                                    print(f"\n👨‍🍳 COOKING STEPS:")
                                    steps = selected_recipe.get('steps', [])
                                    for i, step in enumerate(steps, 1):
                                        print(f"   {i}. {step}")
                                    
                                    tips = selected_recipe.get('tips')
                                    if tips:
                                        print(f"\n💡 COOKING TIPS:")
                                        print(f"   {tips}")
                                    
                                    print("\n" + "="*60)
                            else:
                                print("\nNo suitable dishes found for your ingredients. Try different ingredients!")
                
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
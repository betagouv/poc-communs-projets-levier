# -*- coding: utf-8 -*-

# Import python's built-in regular expression library
import re
import anthropic
from dotenv import load_dotenv
import os
import argparse
import json
import sys
import base64
import copy

load_dotenv()
API_KEY = os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(api_key=API_KEY)

# Importing the prompts, hard-coded in a separate file
from prompts_leviers_competences import (
    system_prompt_classification_TE,
    user_prompt_classification_TE,
    system_prompt_competences,
    user_prompt_competences,
    system_prompt_resume_projet,
    user_prompt_resume_projet,
    system_prompt_questions_fermees_boussole,
    user_prompt_questions_fermees_boussole,
    leviers,
    corrections_leviers
)


def post_treatment_leviers(json_data, leviers_list, corrections_leviers):
    """
    Post-processes leviers (levers) in a JSON response by correcting or removing invalid levers.
    
    This function takes a JSON response containing project information and levers, validates each lever
    against a reference list, and either corrects the lever name using a corrections dictionary or
    removes it if no valid correction exists. The resulting levers are sorted by score in descending order.
    
    Args:
        json_data (dict): A dictionary containing project data with the following structure:
            {
                'projet': str,
                'classification': str,
                'leviers': dict[str, float]
            }
        leviers_list (list): List of valid lever names to check against
        corrections_leviers (dict): Dictionary mapping incorrect lever names to their correct forms
    
    Returns:
        dict: A copy of the input dictionary with processed levers, where:
            - Invalid levers not in corrections_leviers are removed
            - Incorrect lever names are replaced with their corrections
            - Levers are sorted by score in descending order
    """
    
    # Create a deep copy of the entire json_data
    result = copy.deepcopy(json_data)
    
    # Create a copy of leviers to avoid modifying the dict during iteration
    leviers_to_process = dict(result["leviers"])
    
    # Iterate through the copy
    for levier in leviers_to_process:
        # Check if levier is not in the reference list
        if levier not in leviers_list:
            # Check if it exists in corrections dictionary
            if levier in corrections_leviers:
                # Get the corrected value and its score
                corrected_levier = corrections_leviers[levier]
                score = result["leviers"][levier]
                
                # Delete the old key
                del result["leviers"][levier]
                
                # Add the corrected key with the same score
                result["leviers"][corrected_levier] = score
            else:
                # If not in corrections, simply remove it
                del result["leviers"][levier]
    
    # Sort leviers by score in descending order
    sorted_leviers = dict(sorted(result["leviers"].items(), key=lambda x: x[1], reverse=True))
    result["leviers"] = sorted_leviers
    
    return result


def classification_TE(projet: str, system_prompt=system_prompt_classification_TE, user_prompt=user_prompt_classification_TE, model="haiku"):
    """
    Classifies a project's relationship with ecological transition and identifies relevant levers.

    This function uses the Claude LLM to analyze a project description and:
    1. Determines if the project has a link to ecological transition
    2. Identifies relevant levers and their scores
    3. Provides reasoning for the classification
    4. Post-processes the levers to ensure they match reference lists or corrections

    Args:
        projet (str): Description of the project to analyze
        system_prompt (str, optional): System prompt for the LLM. Defaults to system_prompt_classification_TE.
        user_prompt (str, optional): User prompt for the LLM. Defaults to user_prompt_classification_TE.
        model (str, optional): Model version to use ("haiku" or "sonnet"). Defaults to "haiku".

    Returns:
        dict: A dictionary containing:
            - projet (str): Original project description
            - classification (str): Project's relationship with ecological transition
            - leviers (dict): Dictionary of relevant levers and their scores (0-1),
                            post-processed and sorted by descending score
            - raisonnement (str): Detailed reasoning for the classification

    Example:
        >>> result = classification_TE("Rénovation énergétique d'un bâtiment public")
        >>> result
        {
            'projet': "Rénovation énergétique d'un bâtiment public",
            'classification': 'Le projet a un lien avec la transition écologique',
            'leviers': {
                'Sobriété des bâtiments (tertiaire)': 0.9,
                'Rénovation (hors changement chaudières)': 0.8
            },
            'raisonnement': '...'
        }
    """
    
    # Use the MODEL_NAME variable that's being set
    model_name = "claude-3-5-sonnet-20241022" if model == "sonnet" else "claude-3-5-haiku-20241022"
    #print(model_name)
    response = client.messages.create(
        model=model_name,  # Use the variable instead of hardcoding
        max_tokens=1024,
        temperature=0.3,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"}
            }
        ],
            messages=[
        {
            "role": "user",
            "content":
            [{"type": "text",
            "text": user_prompt
            ,"cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text":  "<projet>\n" + projet + "\n</projet>"
            }
            ]
        }
    ]
        )   
    # Print token usage information
    # input_tokens = response.usage.input_tokens
    # output_tokens = response.usage.output_tokens
    # input_tokens_cache_read = getattr(response.usage, 'cache_read_input_tokens', '---')
    # input_tokens_cache_create = getattr(response.usage, 'cache_creation_input_tokens', '---')
    # print(f"User input tokens: {input_tokens}")
    # print(f"Output tokens: {output_tokens}")
    # print(f"Input tokens (cache read): {input_tokens_cache_read}")
    # print(f"Input tokens (cache write): {input_tokens_cache_create}")
    # print(response.content[0].text)

    # Extract content between <json> and <raisonnement> tags
    json_content = re.search(r'<json>(.*?)</json>', response.content[0].text, re.DOTALL)
    raisonnement_content = re.search(r'<raisonnement>(.*?)</raisonnement>', response.content[0].text, re.DOTALL)
    
    # Initialize response dictionary
    response_dict = {
        "projet": projet,
        "classification": None,
        "leviers": [],
        "raisonnement": None
    }
    
    # Parse JSON content
    if json_content:
        json_str = json_content.group(1).strip()
        try:
            json_data = json.loads(json_str)
            # post-treatment of the LLM response for leviers
            json_data = post_treatment_leviers(json_data, leviers, corrections_leviers)
            response_dict.update(json_data)
        except json.JSONDecodeError:
            response_dict["classification"] = "Error in treating the project: Invalid JSON format"
    else:
        print("No JSON content found in the response.")
        response_dict["classification"] = "Error in treating the project: No JSON content found in the LLM response"
    
    # Add reasoning
    if raisonnement_content:
        response_dict["raisonnement"] = raisonnement_content.group(1).strip()
    else:
        response_dict["raisonnement"] = "No raisonnement found in the response."
    return response_dict


def classification_competences(projet: str, system_prompt=system_prompt_competences, user_prompt=user_prompt_competences, model="haiku"):
    # Use the MODEL_NAME variable that's being set
    model_name = "claude-3-5-sonnet-20241022" if model == "sonnet" else "claude-3-5-haiku-20241022"
    #print(model_name)
    response = client.messages.create(
        model=model_name,  # Use the variable instead of hardcoding
        max_tokens=1024,
        temperature=0.3,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"}
            }
        ],
            messages=[
        {
            "role": "user",
            "content":
            [{"type": "text",
            "text": user_prompt
            ,"cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text":  "<projet>\n" + projet + "\n</projet>"
            }
            ]
        }
    ]
        )   
    # Print token usage information
    # input_tokens = response.usage.input_tokens
    # output_tokens = response.usage.output_tokens
    # input_tokens_cache_read = getattr(response.usage, 'cache_read_input_tokens', '---')
    # input_tokens_cache_create = getattr(response.usage, 'cache_creation_input_tokens', '---')
    # print(f"User input tokens: {input_tokens}")
    # print(f"Output tokens: {output_tokens}")
    # print(f"Input tokens (cache read): {input_tokens_cache_read}")
    # print(f"Input tokens (cache write): {input_tokens_cache_create}")
    # print(response.content[0].text)

    #Extract content between <json> 
    json_content = re.search(r'<json>(.*?)</json>', response.content[0].text, re.DOTALL)    
    # Initialize response dictionary
    response_dict = {
        "projet": projet,
        "competences": [],
    }
    
    # Parse JSON content
    if json_content:
        json_str = json_content.group(1).strip()
        try:
            json_data = json.loads(json_str)
            response_dict.update(json_data)
        except json.JSONDecodeError:
            response_dict["competences"] = "Error in treating the project: Invalid JSON format"
    else:
        print("No JSON content found in the response.")
        response_dict["competences"] = "Error in treating the project: No JSON content found"
    
    return response_dict

def generation_question_fermes(projet: str, system_prompt=system_prompt_questions_fermees_boussole, user_prompt=user_prompt_questions_fermees_boussole, model="haiku"):
    # Use the MODEL_NAME variable that's being set
    model_name = "claude-3-5-sonnet-20241022" if model == "sonnet" else "claude-3-5-haiku-20241022"
    #print(LLM_response)
    response = client.messages.create(
        model=model_name,
        temperature = 0.6,
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"}
            }
        ],
            messages=[
        {
            "role": "user",
            "content":
            [{"type": "text",
            "text": user_prompt
            },
            {
                "type": "text",
                "text":  "<projet>\n" + projet + "\n</projet>"
            }
            ]
        }
    ]
        )   
    #print(response.content[0].text)

    # Extract content between <json> and <raisonnement> tags
    json_content = re.search(r'<json>(.*?)</json>', response.content[0].text, re.DOTALL)
    
    # Parse JSON content
    if json_content:
        json_str = json_content.group(1).strip()
        try:
            json_data = json.loads(json_str)
            return json_data
        except json.JSONDecodeError:
            print("Error: Invalid JSON format in response")
            return {
                "Q1": None,
                "Q2": None, 
                "Q3": None
            }
    else:
        print("No JSON content found in response")
        return {
            "Q1": None,
            "Q2": None,
            "Q3": None
        }

def generation_resume(projet,question_reponses,system_prompt=system_prompt_resume_projet, user_prompt=user_prompt_resume_projet, model="haiku"):
    # Use the MODEL_NAME variable that's being set
    model_name = "claude-3-5-sonnet-20241022" if model == "sonnet" else "claude-3-5-haiku-20241022"
    #print(model_name)
    question_reponses = json.dumps(question_reponses, ensure_ascii=False)
    #print(answers)

    response = client.messages.create(
        model=model_name,  # Use the variable instead of hardcoding
        max_tokens=1024,
        temperature = 0.3,
        system=[
            {
                "type": "text",
                "text": system_prompt            }
        ],
            messages=[
        {
            "role": "user",
            "content":
            [{"type": "text",
            "text": user_prompt            },
            {
                "type": "text",
                "text":  "\n <projet>\n" + projet + "\n</projet>\n\n <questions_reponses>\n" + question_reponses + "\n</questions_reponses>"
            }
            ]
        }
    ]
        )   
    resume = response.content[0].text

    return resume

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='matching de projet écologique avec leviers FNV')
    parser.add_argument('projet', help='Description du projet à analyser')
    parser.add_argument('--model', default='haiku', choices=['haiku', 'sonnet'], 
                       help='Modèle à utiliser (default: sonnet)')
    parser.add_argument('--type', default='TE', choices=['TE', 'competences', 'questions', 'resume'],
                       help='Type d\'analyse à effectuer')
    parser.add_argument('--classification', type=str, help='Classification result for questions generation')
    parser.add_argument('--answers', type=str, help='Questions answers for resume generation')
    
    args = parser.parse_args()
    
    if args.type == 'TE':
        response_classification = classification_TE(
            projet=args.projet,  # This will be either the original description or the resume
            system_prompt=system_prompt_classification_TE,
            user_prompt=user_prompt_classification_TE,
            model=args.model
        )
        print(json.dumps(response_classification, ensure_ascii=False))
    elif args.type == 'questions':
        try:
            import time
            start = time.time()
            
            # Debug print with clearer labels
            print("[DEBUG] Received classification", file=sys.stderr)
            
            try:
                response_classification = json.loads(args.classification)
            except json.JSONDecodeError as e:
                print("[ERROR] JSON decode error:", e, file=sys.stderr)
                raise
                
            print(f"[DEBUG] JSON parsing completed in {time.time() - start:.2f}s", file=sys.stderr)
            print(f"[DEBUG] Processing classification: {response_classification['classification']}", file=sys.stderr)
            
            questions_start = time.time()
            questions = generation_question_fermes(
                projet=args.projet,
                model=args.model
            )
            print(f"[DEBUG] Questions generated in {time.time() - questions_start:.2f}s", file=sys.stderr)
            
            print(json.dumps(questions, ensure_ascii=False))
        except Exception as e:
            print(f"Error processing classification: {e}", file=sys.stderr)
            print(f"Args received: {args}", file=sys.stderr)
            sys.exit(1)
    elif args.type == 'resume':
        try:
            print("[DEBUG] Starting resume generation", file=sys.stderr)
            print(f"[DEBUG] Received answers: {args.answers}", file=sys.stderr)
            
            answers = json.loads(args.answers)
            resume = generation_resume(
                projet=args.projet,
                question_reponses=answers,
                model=args.model
            )
            print(resume)  # The function already returns formatted text
        except Exception as e:
            print(f"Error generating resume: {e}", file=sys.stderr)
            print(f"Args received: {args}", file=sys.stderr)
            sys.exit(1)
    else:
        response_competences = classification_competences(
            projet=args.projet,
            system_prompt=system_prompt_competences,
            user_prompt=user_prompt_competences,
            model=args.model
        )
        print(json.dumps(response_competences))
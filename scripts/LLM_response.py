# -*- coding: utf-8 -*-

# Import python's built-in regular expression library
import re
import anthropic
from dotenv import load_dotenv
import os
import argparse
import json

load_dotenv()
API_KEY = os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(api_key=API_KEY)

# Importing the prompts, hard-coded in a separate file
from prompts import system_prompt_classification_TE, user_prompt_classification_TE, system_prompt_competences, user_prompt_competences

def classification_TE(projet: str, system_prompt=system_prompt_classification_TE, user_prompt=user_prompt_classification_TE, model="haiku"):
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
            response_dict.update(json_data)
        except json.JSONDecodeError:
            response_dict["classification"] = "Error in treating the project: Invalid JSON format"
    else:
        print("No JSON content found in the response.")
        response_dict["classification"] = "Error in treating the project: No JSON content found"
    
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

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='matching de projet écologique avec leviers FNV')
    parser.add_argument('projet', help='Description du projet à analyser')
    parser.add_argument('--model', default='haiku', choices=['haiku', 'sonnet'], 
                       help='Modèle à utiliser (default: sonnet)')
    parser.add_argument('--type', default='TE', choices=['TE', 'competences'],
                       help='Type d\'analyse à effectuer')
    
    args = parser.parse_args()
    
    if args.type == 'TE':
        response = classification_TE(
            projet=args.projet,
            system_prompt=system_prompt_classification_TE,
            user_prompt=user_prompt_classification_TE,
            model=args.model
        )
        print(json.dumps(response))
    else:
        response = classification_competences(
            projet=args.projet,
            system_prompt=system_prompt_competences,
            user_prompt=user_prompt_competences,
            model=args.model
        )
        print(json.dumps(response))
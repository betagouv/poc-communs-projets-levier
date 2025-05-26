# -*- coding: utf-8 -*-

# Import python's built-in regular expression library
import re
import anthropic
from dotenv import load_dotenv
import os
import argparse
import json
import pandas as pd
import sys
import base64
import copy
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request
import time


# Importing the prompts, hard-coded in a separate file
from prompts_leviers_competences import (
    system_prompt_classification_TE,
    user_prompt_classification_TE,
    system_prompt_competences_V2,
    user_prompt_competences_V2,
    few_shot_exs_competences_V2,
    system_prompt_resume_projet,
    user_prompt_resume_projet,
    system_prompt_questions_fermees_boussole,
    user_prompt_questions_fermees_boussole,
    leviers as liste_leviers,
    corrections_leviers,
    competences_V2,
)

from LLM_response import (
    post_treatment_leviers,
    post_treatment_competences_V2
)

load_dotenv()
API_KEY = os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(api_key=API_KEY)



def create_batch_requests(df, titre_projet_column, id_column=None, description_projet_column=None,prefix_custom_id=None, model_name="haiku"):
    """Create batch requests for both TE/leviers and competences classifications
    
    Args:
        df: DataFrame containing projects
        titre_projet_column: Column name containing project titles
        id_column : Column name containing the id of the project
        description_projet_column : Column name containing the description of the project
        prefix_custom_id: Prefix for custom IDs when no column id in dataset
    
    Returns:
        Tuple of (requests_TE_leviers, requests_competences)
    """
    requests_TE = []
    requests_competences = []

    print("Inital df length : ", len(df))
    print("\n --------------------------------------------------------------")

    df = df[df[titre_projet_column].notna()]
    print("After removing na for titre_projet_column : ", len(df))
    # Iterate through dataframe rows
    for idx, row in df.iterrows():
        if prefix_custom_id :
            custom_id = f"{prefix_custom_id}_project_{idx}"
        else :
            custom_id = str(row[id_column])
            
        description_projet = row[titre_projet_column]
        if description_projet_column and pd.notna(row[description_projet_column]):
            description_projet += f"\n{row[description_projet_column]}"
        
        if model_name == "sonnet":
             model = "claude-3-7-sonnet-20250219" 
        elif model_name == "haiku":
            model = "claude-3-5-haiku-20241022"

        # Create TE/leviers request
        te_request = {
            "custom_id": custom_id,
            "params": {
                "model": model,
                "max_tokens": 1024,
                "temperature": 0.5,
                "system": [{"type": "text", "text": system_prompt_classification_TE, "cache_control": {"type": "ephemeral"}}],
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt_classification_TE, "cache_control": {"type": "ephemeral"}},
                        {"type": "text", "text": f"<projet>\n{description_projet}\n</projet>"}
                    ]
                }]
            }
        }

        requests_TE.append(te_request)
        
        # Create competences request with same custom_id
        comp_request = {
            "custom_id": custom_id,  # Same custom_id as TE request
            "params": {
                "model": model,
                "max_tokens": 1024,
                "temperature": 0.5,
                "system": [{"type": "text", "text": system_prompt_competences_V2, "cache_control": {"type": "ephemeral"}}],
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": few_shot_exs_competences_V2, "cache_control": {"type": "ephemeral"}},
                        {"type": "text", "text": user_prompt_competences_V2, "cache_control": {"type": "ephemeral"}},
                        {"type": "text", "text": f"<projet>\n{description_projet}\n</projet>"}
                    ]
                }]
            }
        }
        requests_competences.append(comp_request)
    
    return requests_TE, requests_competences

def submit_requests_with_auto_batching(requests, client):
    """
    Submit requests to Claude API, automatically splitting into smaller batches if needed.
    
    Args:
        requests: List of request dictionaries
        client: Anthropic client instance
    
    Returns:
        List of successful batch IDs
    """
    def try_submit_batch(batch):
        try:
            # Convert each request to proper Anthropic types
            formatted_requests = [
                Request(
                    custom_id=req["custom_id"],
                    params=MessageCreateParamsNonStreaming(
                        model=req["params"]["model"],
                        max_tokens=req["params"]["max_tokens"],
                        system=req["params"]["system"],
                        messages=req["params"]["messages"]
                    )
                ) for req in batch
            ]
            
            response = client.messages.batches.create(
                requests=formatted_requests
            )
            print(f"Successfully submitted batch of size {len(batch)} with id {response.id} ")
            return response.id
        except Exception as e:
            print(f"Failed to submit batch of size {len(batch)}: {str(e)}")
            return None
            
    def split_and_submit(requests, split_factor=2):
        # Base case: batch too small to split
        if len(requests) < 2:
            print(f"Warning: Cannot process batch of size {len(requests)}")
            return []
            
        # Try submitting current batch
        batch_id = try_submit_batch(requests)
        if batch_id:
            return [batch_id]
            
        # If batch is too large, split and retry
        if split_factor <= 32:  # Limit split iterations
            batch_size = len(requests) // split_factor
            if batch_size < 1:
                return []
                
            print(f"Splitting into {split_factor} batches of ~{batch_size} requests each")
            batch_ids = []
            
            # Calculate number of full batches
            num_full_batches = split_factor - 1
            
            # Process all but the last batch
            for i in range(0, num_full_batches * batch_size, batch_size):
                sub_batch = requests[i:i + batch_size]
                sub_batch_id = try_submit_batch(sub_batch)
                if sub_batch_id:
                    batch_ids.append(sub_batch_id)
                else:
                    result = split_and_submit(sub_batch, split_factor * 2)
                    batch_ids.extend(result)
            
            # Last batch includes all remaining items
            last_batch = requests[num_full_batches * batch_size:]
            last_batch_id = try_submit_batch(last_batch)
            if last_batch_id:
                batch_ids.append(last_batch_id)
            else:
                result = split_and_submit(last_batch, split_factor * 2)
                batch_ids.extend(result)
                
            if batch_ids:  # If any sub-batches succeeded
                return batch_ids
                
            # If all sub-batches failed, try splitting further
            return split_and_submit(requests, split_factor * 2)
        
        return []  # Give up if we've split too many times

    return split_and_submit(requests)



def check_batch_statuses(list_batch_ids):
    batch_statuses = {}
    while True:
        all_ended = True
        for batch_id in list_batch_ids:
            message_batch = client.messages.batches.retrieve(batch_id)
            status = message_batch.processing_status
            
            if status != batch_statuses.get(batch_id):
                print(f"Batch {batch_id}: {status}")
                batch_statuses[batch_id] = status
                
            if status != "ended":
                all_ended = False
        
        if all_ended:
            break
            
        time.sleep(30)


def process_results_TE_leviers(list_batch_ids,liste_leviers,corrections_leviers):
    results_data = []
    failed_data = []
    
    for batch_id in list_batch_ids:
        batch = client.beta.messages.batches.retrieve(batch_id)
            
        if batch.processing_status == "ended":
            for result in client.beta.messages.batches.results(batch_id):
                base_data = {'custom_id': result.custom_id}
                
                if result.result.type == "succeeded":
                    content = result.result.message.content[0].text
                    json_match = re.search(r'<json>(.*?)</json>', content, re.DOTALL)
                    if json_match:
                        try:
                            json_data = json.loads(json_match.group(1).strip())

                            # post-treatment of the LLM response for leviers
                            json_data = post_treatment_leviers(json_data,liste_leviers,corrections_leviers)

                            row_data = {
                                **base_data,
                                'projet': json_data.get('projet', 'Unknown Project'),
                                'classification_TE': json_data.get('classification', '')
                            }
                            
                            # Process leviers
                            leviers = json_data.get('leviers', {})
                            for i, (levier, score) in enumerate(leviers.items(), 1):
                                if i <= 3:
                                    row_data[f'levier_{i}'] = levier
                                    row_data[f'score_levier_{i}'] = score
                            
                            # Fill missing leviers
                            for i in range(len(leviers) + 1, 4):
                                row_data[f'levier_{i}'] = None
                                row_data[f'score_levier_{i}'] = None
                                
                            results_data.append(row_data)
                            
                        except json.JSONDecodeError:
                            failed_data.append({
                                **base_data,
                                'projet': 'Unknown Project',
                                'error': 'Invalid JSON format'
                            })
                    else:
                        failed_data.append({
                            **base_data,
                            'projet': 'Unknown Project',
                            'error': 'No JSON tags found in response'
                        })
                else:
                    failed_data.append({
                        **base_data,
                        'projet': 'Unknown Project',
                        'error': f"Request failed: {result.result.type}"
                    })
        else :
            print(f"Batch {batch_id} is still processing... with status : {batch.processing_status}")
            #time.sleep(30)
    
    # Create DataFrames
    success_df = pd.DataFrame(results_data)
    failed_df = pd.DataFrame(failed_data)
    
    # Ensure consistent column order
    columns = ['custom_id', 'projet', 'classification_TE']
    for i in range(1, 4):
        columns.extend([f'levier_{i}', f'score_levier_{i}'])
    success_df = success_df.reindex(columns=columns)
    success_df.rename(columns={'projet': 'description_projet'}, inplace=True)
    
    return success_df, failed_df


def process_results_competences(list_batch_ids_competences,dict_competences):
    results_data = []
    failed_data = []
    
    for batch_id in list_batch_ids_competences:
        batch = client.beta.messages.batches.retrieve(batch_id)
            
        if batch.processing_status == "ended":
            for result in client.beta.messages.batches.results(batch_id):
                content = result.result.message.content[0].text if result.result.type == "succeeded" else ""
                base_data = {'custom_id': result.custom_id}
                
                if result.result.type == "succeeded":
                    json_match = re.search(r'<json>(.*?)</json>', content, re.DOTALL)
                    if json_match:
                        try:
                            json_data = json.loads(json_match.group(1).strip())
                            json_data = post_treatment_competences_V2(json_data,dict_competences,None)

                            
                            row_data = {
                                **base_data,
                                'projet': json_data.get('projet', 'Unknown Project')
                            }
                            
                            # Process competences
                            competences = json_data.get('competences', [])
                            for i, comp in enumerate(competences, 1):
                                if i <= 3:  # Max 3 competences
                                    row_data[f'code_competence_{i}'] = comp.get('code', None)
                                    row_data[f'competence_{i}'] = comp.get('competence', None)
                                    row_data[f'score_competence_{i}'] = comp.get('score', None)
                            
                            # Fill missing competences
                            for i in range(len(competences) + 1, 4):
                                row_data[f'code_competence_{i}'] = None
                                row_data[f'competence_{i}'] = None
                                row_data[f'score_competence_{i}'] = None
                                
                            results_data.append(row_data)
                            
                        except json.JSONDecodeError:
                            failed_data.append({
                                **base_data,
                                'projet': 'Unknown Project',
                                'error': 'Invalid JSON format'
                            })
                    else:
                        failed_data.append({
                            **base_data,
                            'projet': 'Unknown Project',
                            'error': 'No JSON tags found in response'
                        })
                else:
                    failed_data.append({
                        **base_data,
                        'projet': 'Unknown Project',
                        'error': f"Request failed: {result.result.type}"
                    })
        else:
            print(f"Batch {batch_id} is still processing... with status : {batch.processing_status}")
            break
    
    # Create DataFrames
    success_df = pd.DataFrame(results_data)
    failed_df = pd.DataFrame(failed_data)
    
    # Ensure consistent column order
    columns = ['custom_id', 'projet']
    for i in range(1, 4):
        columns.extend([f'code_competence_{i}', f'competence_{i}', f'score_competence_{i}'])
    success_df = success_df.reindex(columns=columns)
    success_df.rename(columns={'projet': 'description_projet'}, inplace=True)
    
    return success_df, failed_df

# Function to merge results from both Leviers and Competences with original df
def merge_results_with_df(df,df_TE_leviers,df_competences,column_id,prefix_custom_id=None):

    #adding custom_id to the base df when it has no "id" column originally
    if prefix_custom_id :
         df.insert(0, column_id, f"{prefix_custom_id}_project_" + df.index.astype(str))

    df[column_id] = df[column_id].astype(str)
    df_TE_leviers["custom_id"] = df_TE_leviers["custom_id"].astype(str)
    df_competences["custom_id"] = df_competences["custom_id"].astype(str)

    df_merged = df.merge(
        df_TE_leviers,
        left_on=column_id,
        right_on='custom_id',
        how='left'
    ).merge(
        df_competences,
        left_on=column_id,
        right_on='custom_id',
        how='left'
    )

    df_merged = df_merged.drop(['description_projet_x', 'description_projet_y','custom_id_x', 'custom_id_y'], axis=1)

    return df_merged
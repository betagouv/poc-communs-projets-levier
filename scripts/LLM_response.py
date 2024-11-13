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

system_prompt_levier ="""Tu es un assistant qui a pour but : \n - de classifier si un projet est en lien avec la transition écologique \n - le cas échéant tu dois associer à ce projet en lien avec la transition écologique des leviers pour les mettre en place.\nTu dois retourner un dictionnaire python ou json avec comme clé le nom du projet et comme valeur une liste d'actions avec un score de pertinence. Ta réponse doit TOUJOURS être un JSON valide, même si le projet n'est pas lié à la transition écologique."""

cached_prompt_levier = 'Je dispose d\'une liste de 36 leviers "France Nation Verte" qui ont été définis par le SGPE.\n<description SGPE>\nLe secrétariat général à la planification écologique (SGPE) est placé sous l\'autorité du Premier ministre. Il est chargé de coordonner l\'élaboration des stratégies nationales en matière de climat, d\'énergie, de biodiversité et d\'économie circulaire. Il veille à la mise en œuvre de ces stratégies par l\'ensemble des ministères concernés et à leur déclinaison en plans d\'actions.Le SGPE a pour mission d’assurer la cohérence et le suivi des politiques à visée écologique, d’initier et de cadrer la mobilisation des ministères et parties prenantes, de coordonner toutes les négociations et enfin de mesurer la performance des actions menées.\n</description SGPE>\n\n<loi egalim>\nLa loi Égalim, adoptée en 2018 en France, vise à rééquilibrer les relations commerciales dans le secteur agricole et alimentaire. Elle cherche à assurer une rémunération juste pour les agriculteurs, à renforcer la qualité des produits et à promouvoir une alimentation saine et durable. Elle impose des restrictions sur les promotions, fixe des seuils de revente à perte et promeut des actions pour réduire le gaspillage alimentaire et augmenter la part de produits bio dans les cantines.\n</loi egalim>\n\nVoici la liste des 36 leviers FNV (France Nation Verte) :\n\n<liste_leviers_FNV>\nVéhicules électriques\nBus et cars décarbonés\nTransport en commun\nVélo\nRéduction des déplacements\nCovoiturage\nEfficacité et sobriété logistique\nEfficacité et carburants décarbonés des véhicules\nFret décarboné et multimodalité\nRénovation (tertiaire)\nElectricité renouvelable\nBiogaz\nRéseaux de chaleur décarbonés\nDécarbonation des sites industriels\nPrévention des déchets\nValorisation matière des déchets\nFertilisation azotée\nCollecte des déchets\nRénovation (résidentiel)\nSobriété foncière\nGestion des forêts\nProduits bois\nGestion des haies\nPratiques stockantes\nBouclage biomasse\nRestauration des habitats naturels\nContinuités écologiques\nSurface en aire protégée\nZones de captage d’eau\nSobriété dans l’eau\nDésimperméabilisation des sols\nElevage durable\nLoi Egalim\nGestion des prairies\nAgriculture biologique et de HVE (haute valeur environnementale)\nUsage des phytos\n</liste_leviers_FNV>\n\nJe dispose d\'une liste de projets censés être en lien avec la transition écologique, ils sont définis par une description assez sommaire.\nTa tâche est la suivante :\n- tu dois d\'abord indiquer si la description du projet fournie est en lien avec les enjeux de la transition écologique (Boolean : true ou false)\n- Si le projet est en lien, je veux que tu attribues un ou plusieurs leviers à chaque projet en fonction de leur description.\nLorsque tu associes des leviers je veux que tu me les renvoies dans l\'ordre décroissant de pertinence avec un score ou la pondération que tu utilises pour les classer. sous forme de JSON ou dictionnaire python.\n- tu ne dois fournir que le fichier JSON.\n- Dans l\'hypothèse ou aucune action ne match avec le projet décrit, n\'hallucine pas et explique pourquoi tu n\'as rien associé.\n\nxemples :\n\n<exemple_1>\n<user_input> "Mise en œuvre du programme de restauration du bassin versant du Merderet" </user_input>\n<assistant_output>\n"{\n    "projet": "Mise en œuvre du programme de restauration du bassin versant du Merderet",\n    "is_related": true,\n    "leviers": [\n        {"Restauration des habitats naturels": 0.9},\n        {"Continuités écologiques": 0.7},\n        {"Zones de captage d’eau": 0.6},\n        {"Désimperméabilisation des sols": 0.5}\n    ]\n}"\n</assistant_output>\n</exemple_1>\n\n<exemple_2>\n<user_input> "Aménagement de bourg de Perthus – accès liaison Perthus haut et Perthus Bas" </user_input>\n<assistant_output>\n"{\n    "projet": "Aménagement de bourg de Perthus – accès liaison Perthus haut et Perthus Bas",\n    "is_related": true,\n    "leviers": [\n        {"Transport en commun": 0.9},\n        {"Bus et cars décarbonés": 0.8},\n        {"Réduction des déplacements": 0.7},\n        {"Véhicules électriques": 0.6}\n    ]\n}"\n</assistant_output>\n</exemple_2>\n\n<exemple_3>\n<user_input> "A vaincre sans péril on triomphe sans gloire" </user_input>\n<assistant_output>\n"{\n    "projet": "A vaincre sans péril on triomphe sans gloire",\n    "is_related": false,\n    "leviers": []\n}"\n</assistant_output>\n</exemple_3>\n\n\n'


def get_completion_cached(projet: str, system_prompt="", cached_prompt="", model="haiku"):
    # Use the MODEL_NAME variable that's being set
    model_name = "claude-3-5-sonnet-20241022" if model == "sonnet" else "claude-3-5-haiku-20241022"
    #print(model_name)
    response = client.messages.create(
        model=model_name,  # Use the variable instead of hardcoding
        max_tokens=1024,
        extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
        system=[
            {
                "type": "text",
                "text": system_prompt
            }
        ],
        messages=[
            {
                "role": "user",
                "content":
                [{"type": "text",
                "text": cached_prompt,
                "cache_control": {"type": "ephemeral"}
                },
                {
                    "type": "text",
                    "text": projet
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
    print(response.content[0].text)
    
    try:
        # Try to parse the response as JSON
        response_dict = json.loads(response.content[0].text)
    except json.JSONDecodeError:
        # If parsing fails, create a default response
        response_dict = {
            "projet": projet,
            "is_related": False,
            "leviers": [],
        }    
    return response_dict


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='matching de projet écologique avec leviers FNV')
    parser.add_argument('projet', help='Description du projet à analyser')
    parser.add_argument('--model', default='haiku', choices=['haiku', 'sonnet'], 
                       help='Modèle à utiliser (default: sonnet)')
    
    args = parser.parse_args()
    
    response = get_completion_cached(
        projet=args.projet,
        system_prompt=system_prompt_levier,
        cached_prompt=cached_prompt_levier,
        model=args.model
    )
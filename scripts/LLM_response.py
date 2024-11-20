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

cached_prompt_levier = 'Voici une liste de 36 leviers "France Nation Verte" qui ont été définis par le SGPE.\n<description SGPE>\nLe secrétariat général à la planification écologique (SGPE) est placé sous l\'autorité du Premier ministre. Il est chargé de coordonner l\'élaboration des stratégies nationales en matière de climat, d\'énergie, de biodiversité et d\'économie circulaire. Il veille à la mise en œuvre de ces stratégies par l\'ensemble des ministères concernés et à leur déclinaison en plans d\'actions.Le SGPE a pour mission d’assurer la cohérence et le suivi des politiques à visée écologique, d’initier et de cadrer la mobilisation des ministères et parties prenantes, de coordonner toutes les négociations et enfin de mesurer la performance des actions menées.\n</description SGPE>\n\n<loi egalim>\nLa loi Égalim, adoptée en 2018 en France, vise à rééquilibrer les relations commerciales dans le secteur agricole et alimentaire. Elle cherche à assurer une rémunération juste pour les agriculteurs, à renforcer la qualité des produits et à promouvoir une alimentation saine et durable. Elle impose des restrictions sur les promotions, fixe des seuils de revente à perte et promeut des actions pour réduire le gaspillage alimentaire et augmenter la part de produits bio dans les cantines.\n</loi egalim>\n\nVoici la liste des 36 leviers FNV (France Nation Verte) :\n\n<liste_leviers_FNV>\nVéhicules électriques\nBus et cars décarbonés\nTransport en commun\nVélo\nRéduction des déplacements\nCovoiturage\nEfficacité et sobriété logistique\nEfficacité et carburants décarbonés des véhicules\nFret décarboné et multimodalité\nRénovation (tertiaire)\nElectricité renouvelable\nBiogaz\nRéseaux de chaleur décarbonés\nDécarbonation des sites industriels\nPrévention des déchets\nValorisation matière des déchets\nFertilisation azotée\nCollecte des déchets\nRénovation (résidentiel)\nSobriété foncière\nGestion des forêts\nProduits bois\nGestion des haies\nPratiques stockantes\nBouclage biomasse\nRestauration des habitats naturels\nContinuités écologiques\nSurface en aire protégée\nZones de captage d’eau\nSobriété dans l’eau\nDésimperméabilisation des sols\nElevage durable\nLoi Egalim\nGestion des prairies\nAgriculture biologique et de HVE (haute valeur environnementale)\nUsage des phytos\n</liste_leviers_FNV>\n\nJe dispose d\'une liste de projets censés être en lien avec la transition écologique, ils sont définis par une description assez sommaire.\nTa tâche est la suivante :\n- tu dois d\'abord indiquer si la description du projet fournie est en lien avec les enjeux de la transition écologique (Boolean : true ou false)\n- Si le projet est en lien, je veux que tu attribues un ou plusieurs leviers à chaque projet en fonction de leur description.\nLorsque tu associes des leviers je veux que tu me les renvoies dans l\'ordre décroissant de pertinence avec un score ou la pondération que tu utilises pour les classer. sous forme de JSON ou dictionnaire python.\n- tu ne dois fournir que le fichier JSON.\n- Dans l\'hypothèse ou aucune action ne match avec le projet décrit, n\'hallucine pas et explique pourquoi tu n\'as rien associé.\n\n exemples :\n\n<exemple_1>\n<user_input> "Mise en œuvre du programme de restauration du bassin versant du Merderet" </user_input>\n<assistant_output>\n"{\n    "projet": "Mise en œuvre du programme de restauration du bassin versant du Merderet",\n    "is_related": true,\n    "leviers": [\n        {"Restauration des habitats naturels": 0.9},\n        {"Continuités écologiques": 0.7},\n        {"Zones de captage d’eau": 0.6},\n        {"Désimperméabilisation des sols": 0.5}\n    ]\n}"\n</assistant_output>\n</exemple_1>\n\n<exemple_2>\n<user_input> "Aménagement de bourg de Perthus – accès liaison Perthus haut et Perthus Bas" </user_input>\n<assistant_output>\n"{\n    "projet": "Aménagement de bourg de Perthus – accès liaison Perthus haut et Perthus Bas",\n    "is_related": true,\n    "leviers": [\n        {"Transport en commun": 0.9},\n        {"Bus et cars décarbonés": 0.8},\n        {"Réduction des déplacements": 0.7},\n        {"Véhicules électriques": 0.6}\n    ]\n}"\n</assistant_output>\n</exemple_2>\n\n<exemple_3>\n<user_input> "A vaincre sans péril on triomphe sans gloire" </user_input>\n<assistant_output>\n"{\n    "projet": "A vaincre sans péril on triomphe sans gloire",\n    "is_related": false,\n    "leviers": []\n}"\n</assistant_output>\n</exemple_3>\n\n\n'

system_prompt_levier_v2="Tu es un assistant dont le but est, à partir de la description d’un projet :\n\t•\tDe classifier si le projet est en lien avec la transition écologique : Boolean true ou false.\n\t•\tPar ailleurs, et seulement si c’est pertinent, tu dois associer un ou plusieurs leviers à la description du projet.\n\t•\tTu dois également fournir une explication de tes choix, en expliquant pourquoi le projet est ou n’est pas lié à la transition écologique, et quel est le lien avec les leviers lorsqu’il y en a.\n\nTu dois retourner un JSON avec les champs suivants :\n\t•\t\"projet\" : la description du projet.\n\t•\t\"is_related\" : Boolean true ou false.\n\t•\t\"leviers\" : une liste de paires {\"nom du levier\": score}, classés par ordre décroissant de score. Ce champ peut être vide si aucun levier n’est pertinent.\n\t•\t\"explications\" : une explication de tes choix.\n\nTa réponse doit TOUJOURS être un JSON valide."

cached_prompt_levier_v2="Voici la liste des leviers dont tu disposes :\n<leviers>\n“Gestion des forêts et produits bois”\n“Changements de pratiques de fertilisation azotée”\n“Elevage durable”\n“Gestion des haies”\n“Bâtiments & Machines agricoles”\n“Gestion des prairies”\n“Pratiques stockantes”\n“Sobriété foncière”\n“Surface en aire protégée”\n“Résorption des points noirs prioritaires de continuité écologique”\n“Restauration des habitats naturels”\n“Réduction de l’usage des produits phytosanitaires”\n“Développement de l’agriculture biologique et de HVE”\n“Respect d’Egalim pour la restauration collective”\n“Sobriété des bâtiments (résidentiel)”\n“Changement chaudières fioul + rénovation (résidentiel)”\n“Changement chaudières gaz + rénovation (résidentiel)”\n“Rénovation (hors changement chaudières)”\n“Sobriété des bâtiments (tertiaire)”\n“Changement chaudières fioul + rénovation (tertiaire)”\n“Changement chaudières gaz + rénovation (tertiaire)”\n“Gaz fluorés résidentiel”\n“Gaz fluorés tertiaire”\n“Captage de méthane dans les ISDND”\n“Sobriété déchets”\n“Valorisation matière des déchets”\n“Collecte et tri des déchets”\n“Sobriété dans l’utilisation de la ressource en eau”\n“Protection des zones de captage d’eau”\n“Désimperméabilisation des sols”\n“Electricité renouvelable”\n“Biogaz”\n“Réseaux de chaleur décarbonés”\n“Top 50 sites industriels”\n“Industrie diffuse”\n“Fret décarboné et multimodalité”\n“Efficacité et sobriété logistique”\n“Réduction des déplacements”\n“Covoiturage”\n“Vélo”\n“Transports en commun”\n“Véhicules électriques”\n“Efficacité énergétique des véhicules privés”\n“Bus et cars décarbonés”\n“2 roues (élec & efficacité)”\n“Nucléaire”\n“Bio-carburants”\n“Efficacité des aéronefs”\n“SAF”\n</leviers>\n\n<acronymes>\n1. HVE: Haute Valeur Environnementale\n2. Egalim : Loi visant à améliorer les relations commerciales agricoles et promouvoir une alimentation saine et durable\n3. ISDND : Installations de Stockage de Déchets Non Dangereux\n4. SAF : Sustainable Aviation Fuel (carburant d’aviation durable)\n</acronymes>\n\n<exemple_1>\n<user_input> “Réhabilitation d’un ancien couvent en 8 logements à destination des personnes âgées souhaitant se rapprocher des services et commerces au cœur du village.” </user_input>\n<assistant_output>\n{\n“projet”: “Réhabilitation d’un ancien couvent en 8 logements à destination des personnes âgées souhaitant se rapprocher des services et commerces au cœur du village.”,\n“is_related”: true,\n“leviers”: [\n{“Sobriété foncière”: 0.9},\n{“Rénovation (hors changement chaudières)”: 0.8},\n{“Sobriété des bâtiments (résidentiel)”: 0.7}\n],\n“explications”: “Le projet réutilise un bâtiment existant, ce qui évite l’étalement urbain (sobriété foncière). La rénovation peut intégrer des améliorations énergétiques (rénovation hors changement chaudières) pour réduire la consommation d’énergie. En rapprochant les résidents des services et commerces, il favorise également la réduction des déplacements motorisés.”\n}\n</assistant_output>\n</exemple_1>\n\n<exemple_2>\n<user_input> “Aménagement du SAS de la mairie et désimperméabilisation des extérieurs” </user_input>\n<assistant_output>\n{\n“projet”: “Aménagement du SAS de la mairie et désimperméabilisation des extérieurs”,\n“is_related”: true,\n“leviers”: [\n{“Désimperméabilisation des sols”: 1.0}\n],\n“explications”: “Le projet mentionne explicitement la désimperméabilisation des sols, ce qui améliore l’infiltration des eaux pluviales, réduit le ruissellement et contribue à la gestion durable de l’eau.”\n}\n</assistant_output>\n</exemple_2>\n\n<exemple_3>\n<user_input> “Nouvelle voie d’accès à l’Ecoparc de Ferrières” </user_input>\n<assistant_output>\n{\n“projet”: “Nouvelle voie d’accès à l’Ecoparc de Ferrières”,\n“is_related”: true,\n“leviers”: [\n{“Fret décarboné et multimodalité”: 0.6},\n{“Efficacité et sobriété logistique”: 0.5}\n],\n“explications”: “L’accès amélioré à un écoparc peut faciliter le transport de marchandises par des modes de transport plus écologiques (fret décarboné et multimodalité) et optimiser les flux logistiques, contribuant ainsi à une logistique plus efficace et sobre.”\n}\n</assistant_output>\n</exemple_3>\n\n<exemple_4>\n<user_input> “Création d’un city-stade” </user_input>\n<assistant_output>\n{\n“projet”: “Création d’un city-stade”,\n“is_related”: false,\n“leviers”: [],\n“explications”: “Le projet concerne la construction d’une installation sportive sans lien direct avec la transition écologique ni avec les leviers disponibles.”\n}\n</assistant_output>\n</exemple_4>\n\n<exemple_5>\n<user_input> “Organisation d’un festival de musique locale” </user_input>\n<assistant_output>\n{\n“projet”: “Organisation d’un festival de musique locale”,\n“is_related”: false,\n“leviers”: [\n{“Réduction des déplacements”: 0.4},\n{“Sobriété déchets”: 0.3}\n],\n“explications”: “Bien que le projet ne soit pas directement lié à la transition écologique, il peut incorporer des éléments tels que la réduction des déplacements en encourageant la participation locale et la gestion responsable des déchets pendant l’événement.”\n}\n</assistant_output>\n</exemple_5>\n\n"

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
        system_prompt=system_prompt_levier_v2,
        cached_prompt=cached_prompt_levier_v2,
        model=args.model
    )
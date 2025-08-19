#!/usr/bin/env python3
import json
import glob
import os
from datetime import datetime

def process_experiment_files():
    """Process all experiment JSON files and create index"""
    
    experiments = []
    data_dir = "data/experiments"
    
    # Process each JSON file
    for filepath in glob.glob(f"{data_dir}/*.json"):
        with open(filepath, 'r') as f:
            data = json.load(f)
            
        # Extract key metrics for index
        experiments.append({
            'filename': os.path.basename(filepath),
            'sessionId': data['sessionInfo']['sessionId'],
            'duration': data['sessionInfo']['duration'],
            'inferenceCount': len(data.get('inferences', [])),
            'timestamp': data['sessionInfo']['startTime']
        })
    
    # Sort by timestamp
    experiments.sort(key=lambda x: x['timestamp'], reverse=True)
    
    # Write index file
    with open('data/experiments.json', 'w') as f:
        json.dump(experiments, f, indent=2)
    
    print(f"Processed {len(experiments)} experiment files")

if __name__ == "__main__":
    process_experiment_files()
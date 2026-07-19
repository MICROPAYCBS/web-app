import csv
import json
import os

# --- CHANGE THIS LINE TO YOUR ACTUAL CSV FILENAME ---
filename = 'Uganda_Villages_List.csv' 
# ---------------------------------------------------

location_tree = {}
row_count = 0

print(f"Looking for {filename} in {os.getcwd()}...")

try:
    # utf-8-sig fixes the hidden character issue on Windows CSVs
    with open(filename, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # We use .get() and .strip() safely to avoid KeyError if headers are slightly off
                region = row.get('Region', '').strip()
                district = row.get('District', '').strip()
                county = row.get('County', '').strip()
                sub_county = row.get('Sub County', '').strip()
                parish = row.get('Parish', '').strip()
                village = row.get('Village', '').strip()

                if not region: continue # Skip empty rows

                # Build the hierarchy step-by-step
                if region not in location_tree:
                    location_tree[region] = {}
                if district not in location_tree[region]:
                    location_tree[region][district] = {}
                if county not in location_tree[region][district]:
                    location_tree[region][district][county] = {}
                if sub_county not in location_tree[region][district][county]:
                    location_tree[region][district][county][sub_county] = {}
                if parish not in location_tree[region][district][county][sub_county]:
                    location_tree[region][district][county][sub_county][parish] = []
                    
                # Append the village
                if village and village not in location_tree[region][district][county][sub_county][parish]:
                    location_tree[region][district][county][sub_county][parish].append(village)
                
                row_count += 1

            except Exception as inner_e:
                print(f"Error processing a row: {inner_e}")

    print(f"Successfully processed {row_count} rows. Writing to JSON...")

    # Save the output
    with open('locations.json', 'w', encoding='utf-8') as f:
        json.dump(location_tree, f, separators=(',', ':'))

    print("Done! locations.json has been created.")

except FileNotFoundError:
    print(f"ERROR: Could not find '{filename}'. Please make sure it is in the same folder as this script.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
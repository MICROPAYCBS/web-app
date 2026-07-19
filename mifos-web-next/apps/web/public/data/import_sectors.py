import csv
import json
import os

# --- CHANGE THIS LINE TO YOUR ACTUAL CSV FILENAME ---
filename = 'sectors_data.csv'
# ---------------------------------------------------

sector_tree = {}
row_count = 0

print(f"Looking for {filename} in {os.getcwd()}...")

try:
    with open(filename, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                sector = row.get('Sector', '').strip()
                industry = row.get('Industry', '').strip()
                sub_industry = row.get('Sub Industry', '').strip()

                if not sector:
                    continue

                if sector not in sector_tree:
                    sector_tree[sector] = {}
                if industry not in sector_tree[sector]:
                    sector_tree[sector][industry] = []

                if sub_industry and sub_industry not in sector_tree[sector][industry]:
                    sector_tree[sector][industry].append(sub_industry)

                row_count += 1

            except Exception as inner_e:
                print(f"Error processing a row: {inner_e}")

    print(f"Successfully processed {row_count} rows. Writing to JSON...")

    with open('sectors.json', 'w', encoding='utf-8') as f:
        json.dump(sector_tree, f, separators=(',', ':'), ensure_ascii=False)

    sector_count = len(sector_tree)
    industry_count = sum(len(industries) for industries in sector_tree.values())
    sub_industry_count = sum(
        len(sub_industries)
        for industries in sector_tree.values()
        for sub_industries in industries.values()
    )
    print(
        f"Done! sectors.json has been created "
        f"({sector_count} sectors, {industry_count} industries, {sub_industry_count} sub-industries)."
    )

except FileNotFoundError:
    print(f"ERROR: Could not find '{filename}'. Please make sure it is in the same folder as this script.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

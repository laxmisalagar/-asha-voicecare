import sys
sys.path.insert(0, '/c/Users/KIRAN S/ashavoicecare/backend')

# Read and exec the main module
with open('/c/Users/KIRAN S/ashavoicecare/backend/main.py', 'r') as f:
    content = f.read()

# Remove the if __name__ block for testing
if_block_idx = content.find('\nif __name__')
if if_block_idx >= 0:
    content = content[:if_block_idx]

# Extract just the extract_entities function
import re
func_match = re.search(r'def extract_entities\(.*?^    return record', content, re.DOTALL | re.MULTILINE)
if func_match:
    func_code = func_match.group(0)
    exec(func_code)
    
    result = extract_entities(
        'Today I visited beneficiary ID 1025. This is a newborn visit. Baby weight is 2.8 kilo. Vaccination status is completed. Next visit after one month.',
        'en'
    )
    import json
    print(json.dumps(result.dict(), indent=2, default=str))
else:
    print("Could not find extract_entities function")
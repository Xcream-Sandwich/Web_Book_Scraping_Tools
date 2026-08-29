import os
import re

MAPPINGS = {
    # Backgrounds
    r'\bbg-zinc-950\b': 'bg-white dark:bg-zinc-950',
    r'\bbg-zinc-900\b': 'bg-zinc-50 dark:bg-zinc-900',
    r'\bbg-zinc-800\b': 'bg-zinc-100 dark:bg-zinc-800',
    r'\bbg-zinc-700\b': 'bg-zinc-200 dark:bg-zinc-700',
    
    # Text
    r'\btext-zinc-100\b': 'text-zinc-900 dark:text-zinc-100',
    r'\btext-zinc-200\b': 'text-zinc-800 dark:text-zinc-200',
    r'\btext-zinc-300\b': 'text-zinc-700 dark:text-zinc-300',
    r'\btext-zinc-400\b': 'text-zinc-500 dark:text-zinc-400',
    r'\btext-zinc-500\b': 'text-zinc-500 dark:text-zinc-500',
    r'\btext-zinc-600\b': 'text-zinc-400 dark:text-zinc-600',
    r'\btext-zinc-700\b': 'text-zinc-400 dark:text-zinc-700',
    
    # Borders
    r'\bborder-zinc-900\b': 'border-zinc-100 dark:border-zinc-900',
    r'\bborder-zinc-800\b': 'border-zinc-200 dark:border-zinc-800',
    r'\bborder-zinc-700\b': 'border-zinc-300 dark:border-zinc-700',
    
    # Hover text
    r'\bhover:text-zinc-100\b': 'hover:text-zinc-900 dark:hover:text-zinc-100',
    r'\bhover:text-zinc-200\b': 'hover:text-zinc-800 dark:hover:text-zinc-200',
    r'\bhover:text-zinc-300\b': 'hover:text-zinc-700 dark:hover:text-zinc-300',
    
    # Hover backgrounds
    r'\bhover:bg-zinc-800\b': 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    r'\bhover:bg-zinc-700\b': 'hover:bg-zinc-200 dark:hover:bg-zinc-700',
    
    # Selection
    r'\bselection:bg-indigo-500\b': 'selection:bg-indigo-500/30 dark:selection:bg-indigo-500',
    r'\bselection:text-white\b': 'selection:text-indigo-900 dark:selection:text-white',

    # Specific fixes
    r'\bshadow-inner\b': 'shadow-sm dark:shadow-inner',
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Iterate through mappings and replace
    for pattern, replacement in MAPPINGS.items():
        # Avoid double replacing if it's already there (rudimentary check)
        if replacement not in content:
             content = re.sub(pattern, replacement, content)
             
    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

print("Transformation complete.")

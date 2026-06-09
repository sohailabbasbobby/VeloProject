import os, re, json

paths = ['/Users/Bobby/Documents/Velo/VeloProject/customer-mobile-app/src/screens', '/Users/Bobby/Documents/Velo/VeloProject/customer-mobile-app/src/components']
strings = set()

for p in paths:
    if not os.path.exists(p): continue
    for f in os.listdir(p):
        if f.endswith('.tsx'):
            with open(os.path.join(p, f), 'r') as file:
                content = file.read()
                # Find all Text content
                matches = re.findall(r'<Text[^>]*>(.*?)</Text>', content, re.DOTALL)
                for m in matches:
                    # Remove anything inside {} or empty space
                    clean = re.sub(r'\{.*?\}', '', m).strip()
                    # Filter out short icons or pure punctuation
                    if clean and len(clean) > 1 and clean not in ['✕', '▼', '✓', '›', '●', '+', '⚙︎', '→', '🚘', '⚲', '📞', '➤']:
                        strings.add(clean)

print(json.dumps(sorted(list(strings)), indent=2))

#!/usr/bin/env python3
import os
import re

routes_dir = "/project/workspace/server/src/routes"

files_to_update = [
    "auth.ts", "careers.ts", "contactMessages.ts", "contentSubmissions.ts",
    "countries.ts", "courses.ts", "deliveryPartners.ts", "demoRequests.ts",
    "donationImpacts.ts", "donations.ts", "elearningEnrollments.ts",
    "elearningStats.ts", "events.ts", "generic.ts", "legalPages.ts",
    "liveStreams.ts", "news.ts", "newsletterSubscriptions.ts", "orders.ts",
    "partners.ts", "partnerships.ts", "promoCodes.ts", "seeds.ts",
    "shopProducts.ts", "stats.ts", "successStories.ts", "tasks.ts",
    "userRoles.ts", "profiles.ts"
]

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Remove PrismaClient from imports
    content = re.sub(
        r"import \{ (.*?)PrismaClient,?\s*(.*?) \} from '@prisma/client';",
        lambda m: f"import {{ {m.group(1).replace('PrismaClient, ', '').replace(', PrismaClient', '').replace('PrismaClient', '').strip(', ')}{m.group(2)} }} from '@prisma/client';" if (m.group(1) + m.group(2)).replace('PrismaClient', '').strip(', ') else "",
        content
    )
    
    content = re.sub(
        r"import \{ PrismaClient \} from '@prisma/client';",
        "",
        content
    )
    
    # Remove the prisma instantiation line
    content = re.sub(
        r"\nconst prisma = new PrismaClient\(\);",
        "",
        content
    )
    
    # Add the singleton import after the first import statement
    first_import_match = re.search(r"(import .+ from .+;)", content)
    if first_import_match:
        first_import_end = first_import_match.end()
        # Check if prisma import already exists
        if "import { prisma } from '../lib/prisma';" not in content:
            content = content[:first_import_end] + "\nimport { prisma } from '../lib/prisma';" + content[first_import_end:]
    
    # Clean up multiple empty lines
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Updated: {filepath}")

# Also update index.ts
index_path = "/project/workspace/server/src/index.ts"

for filename in files_to_update:
    filepath = os.path.join(routes_dir, filename)
    if os.path.exists(filepath):
        update_file(filepath)

# Update index.ts separately
if os.path.exists(index_path):
    with open(index_path, 'r') as f:
        content = f.read()
    
    content = re.sub(
        r"import \{ PrismaClient \} from '@prisma/client';",
        "",
        content
    )
    content = re.sub(
        r"\nconst prisma = new PrismaClient\(\);",
        "",
        content
    )
    
    # Add prisma import after env import
    if "import { prisma } from './lib/prisma';" not in content:
        content = re.sub(
            r"(import \{ env \} from './utils/env';)",
            r"\1\nimport { prisma } from './lib/prisma';",
            content
        )
    
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    with open(index_path, 'w') as f:
        f.write(content)
    print(f"Updated: {index_path}")

print("\nAll files updated successfully!")

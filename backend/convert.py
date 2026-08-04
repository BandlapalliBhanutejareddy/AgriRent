import re

with open('d:/AgriRent_AI/backend/prisma/schema.prisma', 'r') as f:
    content = f.read()

# Replace provider and url
content = re.sub(r'provider\s*=\s*"postgresql"', 'provider = "sqlite"', content)
content = re.sub(r'url\s*=\s*env\("DATABASE_URL"\)', 'url = "file:./dev.db"', content)
content = re.sub(r'directUrl\s*=\s*env\("DIRECT_URL"\)\n', '', content)

# Replace enums with String
content = re.sub(r'role\s+Role', 'role String', content)
content = re.sub(r'status\s+BookingStatus', 'status String', content)

# Remove enum blocks
content = re.sub(r'enum Role \{.*?\n\}', '', content, flags=re.DOTALL)
content = re.sub(r'enum BookingStatus \{.*?\n\}', '', content, flags=re.DOTALL)

with open('d:/AgriRent_AI/backend/prisma/schema.prisma', 'w') as f:
    f.write(content)

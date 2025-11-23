import os

SECRET_KEY = os.getenv("SECRET_KEY", "isc-cyber-range-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
DATABASE_URL = "postgresql://postgres:shibin@localhost:5432/cyberlab"

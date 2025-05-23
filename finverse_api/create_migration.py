"""
Helper script to create an Alembic migration for the model unification
"""
import os
import subprocess

# Set the current working directory to the API root
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Create a new migration
subprocess.run([
    "alembic", 
    "revision", 
    "--autogenerate", 
    "-m", "Unified transaction model and stake model"
])

print("Migration created successfully!")
print("Now run: alembic upgrade head")

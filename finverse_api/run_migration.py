"""
Migration helper script for FinVerse API
"""

import os
import sys
import subprocess


def run_migrations():
    """Run Alembic migrations to latest version"""
    print("Running database migrations...")
    
    try:
        # Run the migration
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True
        )
        
        print("Migration output:")
        print(result.stdout)
        
        if result.returncode == 0:
            print("Migration completed successfully!")
        else:
            print("Migration failed with error code:", result.returncode)
            print("Error output:")
            print(result.stderr)
            
    except subprocess.CalledProcessError as e:
        print(f"Migration failed: {e}")
        print("Error output:")
        print(e.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


def check_migration_status():
    """Check current migration status"""
    print("Checking current migration status...")
    
    try:
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True,
            check=True
        )
        
        print("Current migration status:")
        print(result.stdout or "No migrations applied yet")
        
    except subprocess.CalledProcessError as e:
        print(f"Status check failed: {e}")
        print(e.stderr)
    

if __name__ == "__main__":
    # Change to the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Check current status
    check_migration_status()
    
    # Prompt user to confirm migration
    response = input("\nDo you want to run the migration? (y/n): ")
    
    if response.lower() in ('y', 'yes'):
        run_migrations()
    else:
        print("Migration aborted.") 
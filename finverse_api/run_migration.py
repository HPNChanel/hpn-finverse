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
            print("\nVerifying migration status...")
            check_migration_status()
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
        
        # Also check history
        history_result = subprocess.run(
            ["alembic", "history", "--verbose"],
            capture_output=True,
            text=True,
            check=True
        )
        
        print("\nMigration history:")
        print(history_result.stdout or "No migration history")
        
    except subprocess.CalledProcessError as e:
        print(f"Status check failed: {e}")
        print(e.stderr)


def show_pending_migrations():
    """Show any pending migrations"""
    print("Checking for pending migrations...")
    
    try:
        result = subprocess.run(
            ["alembic", "show", "head"],
            capture_output=True,
            text=True,
            check=True
        )
        
        print("Latest migration:")
        print(result.stdout)
        
    except subprocess.CalledProcessError as e:
        print(f"Could not check pending migrations: {e}")
    

if __name__ == "__main__":
    # Change to the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print("=== FinVerse Database Migration Tool ===")
    print()
    
    # Check current status
    check_migration_status()
    print()
    
    # Show pending migrations
    show_pending_migrations()
    print()
    
    # Prompt user to confirm migration
    response = input("Do you want to run the migration? (y/n): ")
    
    if response.lower() in ('y', 'yes'):
        run_migrations()
    else:
        print("Migration aborted.")
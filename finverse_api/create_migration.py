"""
Helper script to create an Alembic migration for syncing models with database
"""
import os
import subprocess
import sys

def main():
    # Set the current working directory to the API root
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    print("Generating migration to sync models with database...")
    print("This will detect changes in:")
    print("- financial_goals table schema")
    print("- Any other model changes")
    print()
    
    try:
        # Create a new migration with autogenerate
        result = subprocess.run([
            "alembic", 
            "revision", 
            "--autogenerate", 
            "-m", "Sync models with DB: update financial_goals schema"
        ], capture_output=True, text=True, check=True)
        
        print("Migration created successfully!")
        print("Output:", result.stdout)
        
        if result.stderr:
            print("Warnings:", result.stderr)
            
        print("\nNext steps:")
        print("1. Review the generated migration file in alembic/versions/")
        print("2. Run: python run_migration.py")
        print("3. Or run: alembic upgrade head")
        
    except subprocess.CalledProcessError as e:
        print(f"Error creating migration: {e}")
        print("stdout:", e.stdout)
        print("stderr:", e.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

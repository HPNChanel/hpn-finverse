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
    print("- Replace username column with email in users table (email-based authentication)")
    print("- DECIMAL precision updates for financial fields")
    print("- AI & Blockchain fields in unified stakes table")
    print("- UNIFY staking models: drop staking_positions, enhance stakes with all functionality")
    print("- Budget model enhancements (replacing legacy budget_plan)")
    print("- REMOVE broken BudgetPlan relationships from FinancialAccount")
    print("- REMOVE budget_plan table completely")
    print("- ADD User.budget_alerts relationship (fixes SQLAlchemy mapping error)")
    print("- Module structure cleanup and consolidation")
    print("- New foreign key relationships (Transaction->Budget, Goal->Account)")
    print("- Any other model changes")
    print()
    
    # Verify environment setup
    print("🔍 Verifying Alembic environment setup...")
    try:
        # Test that models can be imported
        from app.models import User, Budget, BudgetAlert
        from app.models.stake import Stake  # Only unified Stake model
        print("✅ Models imported successfully")
        print("✅ Unified Stake model imported successfully")
        
        # Test Base metadata
        from app.db.session import Base
        print(f"✅ Base metadata contains {len(Base.metadata.tables)} tables")
        
    except Exception as e:
        print(f"⚠️ Environment setup issue: {e}")
        print("Make sure all models are properly imported in alembic/env.py")
    
    try:
        # Create a new migration with autogenerate
        result = subprocess.run([
            "alembic", 
            "revision", 
            "--autogenerate", 
            "-m", "Unified Stake model consolidation, remove staking_positions table, User.budget_alerts relationship, replace username with email, enhance models with DECIMAL precision and AI fields"
        ], capture_output=True, text=True, check=True)
        
        print("Migration created successfully!")
        print("Output:", result.stdout)
        
        if result.stderr:
            print("Warnings:", result.stderr)
            
        print("\nNext steps:")
        print("1. Review the generated migration file in alembic/versions/")
        print("2. Ensure unified Stake model replaces both legacy models")
        print("3. Ensure staking_positions table is dropped safely")
        print("4. Ensure User.budget_alerts relationship is properly added")
        print("5. Verify username column is dropped and email column is added")
        print("6. Verify budget_plan table is dropped completely")
        print("7. Run: python run_migration.py")
        print("8. Or run: alembic upgrade head")
        
    except subprocess.CalledProcessError as e:
        print(f"Error creating migration: {e}")
        print("Error output:", e.stderr)
        print("Make sure alembic is properly configured and database is accessible")
        print("\n🔧 Troubleshooting:")
        print("1. Check that DATABASE_URL is correctly set")
        print("2. Ensure all models are imported in alembic/env.py")
        print("3. Verify database connectivity")
        print("4. Check that Base.metadata is properly configured")
        print("5. Ensure unified Stake model is properly registered")
        
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main()

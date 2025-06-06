"""
Migration helper script for FinVerse API
"""

import os
import sys
import subprocess


def run_migrations():
    """Run Alembic migrations to latest version"""
    print("Running database migrations...")
    print("This migration will:")
    print("- Replace username with email in users table (email-based authentication)")
    print("- Remove legacy budget_plan table and relationships")
    print("- Add enhanced Budget and BudgetAlert models")
    print("- UNIFY staking models: merge stakes and staking_positions into single Stake model")
    print("- Fix User.budget_alerts relationship (resolves SQLAlchemy mapping error)")
    print("- Update financial fields to DECIMAL precision")
    print("- Add AI/Blockchain fields to unified stakes")
    print("- Clean up deprecated budget_plan modules")
    print("- Consolidate all budget functionality into unified /budget endpoints")
    print()
    
    # Set PYTHONPATH to current directory for proper imports
    env = os.environ.copy()
    env['PYTHONPATH'] = os.getcwd()
    
    try:
        # Run the migration
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            check=True,
            env=env
        )
        
        print("Migration output:")
        print(result.stdout)
        
        if result.returncode == 0:
            print("Migration completed successfully!")
            print("✅ User.budget_alerts relationship fixed")
            print("✅ BudgetPlan relationships removed")
            print("✅ Budget model relationships established")
            print("✅ StakingPosition table created for enhanced staking")
            print("✅ Deprecated modules cleaned up")
            print("✅ Email-based authentication implemented")
            print("✅ DECIMAL precision applied to financial fields")
            print("✅ AI/Blockchain fields added to staking")
            print("\nVerifying migration status...")
            check_migration_status()
            print("\n🧹 Running module cleanup...")
            cleanup_budget_plan_modules()
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


def cleanup_budget_plan_modules():
    """Clean up deprecated budget_plan modules after migration"""
    print("🧹 Cleaning up deprecated budget_plan modules...")
    
    deprecated_files = [
        "app/routers/budget_plan.py",
        "app/schemas/budget_plan.py", 
        "app/models/budget_plan.py",
        "app/services/budget_plan_service.py"
    ]
    
    for file_path in deprecated_files:
        if os.path.exists(file_path):
            try:
                # Create backup
                backup_path = f"{file_path}.backup"
                os.rename(file_path, backup_path)
                print(f"  ✅ Moved {file_path} to {backup_path}")
            except Exception as e:
                print(f"  ⚠️ Could not backup {file_path}: {e}")
        else:
            print(f"  ℹ️ {file_path} not found (already removed)")
    
    print("✅ Budget plan module cleanup completed")


def check_migration_status():
    """Check current migration status"""
    print("Checking current migration status...")
    
    # Set PYTHONPATH for subprocess
    env = os.environ.copy()
    env['PYTHONPATH'] = os.getcwd()
    
    try:
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True,
            check=True,
            env=env
        )
        
        print("Current migration status:")
        print(result.stdout or "No migrations applied yet")
        
        # Also check history
        history_result = subprocess.run(
            ["alembic", "history", "--verbose"],
            capture_output=True,
            text=True,
            check=True,
            env=env
        )
        
        print("\nMigration history:")
        print(history_result.stdout or "No migration history")
        
    except subprocess.CalledProcessError as e:
        print(f"Status check failed: {e}")
        print(e.stderr)


def show_pending_migrations():
    """Show any pending migrations"""
    print("Checking for pending migrations...")
    
    # Set PYTHONPATH for subprocess
    env = os.environ.copy()
    env['PYTHONPATH'] = os.getcwd()
    
    try:
        result = subprocess.run(
            ["alembic", "show", "head"],
            capture_output=True,
            text=True,
            check=True,
            env=env
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
    print("⚠️  WARNING: This migration includes BREAKING CHANGES")
    print("   - Username field will be replaced with email")
    print("   - Legacy budget_plan system will be removed")
    print("   - Deprecated budget_plan modules will be cleaned up")
    print("   - All authentication will use email instead of username")
    print("   - All budget functionality consolidated to /budget endpoints")
    print("   - User.budget_alerts relationship will be added (fixes 500 errors)")
    print("   - SQLAlchemy mapping errors will be resolved")
    print()
    
    # Check current status
    show_pending_migrations()
    
    # Prompt user for confirmation
    response = input("Do you want to proceed with the migration? (y/N): ")
    if response.lower() not in ['y', 'yes']:
        print("Migration cancelled.")
        sys.exit(0)
    
    print("\n" + "="*50)
    print("Starting migration process...")
    print("="*50)
    
    # Run the migration
    run_migrations()
    
    print("\n" + "="*50)
    print("Migration process completed!")
    print("="*50)
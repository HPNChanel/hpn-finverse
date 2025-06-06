"""
Cleanup script to remove deprecated modules after migration
Run this after successful database migration to clean up old files
"""

import os
import shutil
import sys
import re
from pathlib import Path

def backup_file(file_path):
    """Create a backup of a file before deletion"""
    backup_path = f"{file_path}.backup"
    try:
        shutil.copy2(file_path, backup_path)
        print(f"  ✅ Backed up: {file_path} -> {backup_path}")
        return True
    except Exception as e:
        print(f"  ❌ Failed to backup {file_path}: {e}")
        return False

def remove_deprecated_file(file_path, description):
    """Remove a deprecated file with backup"""
    if os.path.exists(file_path):
        print(f"\n🗑️  Removing deprecated {description}: {file_path}")
        if backup_file(file_path):
            try:
                os.remove(file_path)
                print(f"  ✅ Removed: {file_path}")
                return True
            except Exception as e:
                print(f"  ❌ Failed to remove {file_path}: {e}")
                return False
    else:
        print(f"  ℹ️  File not found (already removed?): {file_path}")
        return True

def search_and_replace_in_file(file_path, search_pattern, replacement):
    """Search and replace pattern in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        original_content = content
        # Replace budget_plan with budget (case sensitive)
        content = re.sub(search_pattern, replacement, content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"  ✅ Updated: {file_path}")
            return True
        else:
            print(f"  ℹ️ No changes needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"  ❌ Failed to update {file_path}: {e}")
        return False

def cleanup_budget_plan_references():
    """Clean up budget_plan references in remaining files"""
    print("\n🔄 Searching and replacing budget_plan references...")
    
    # Patterns to search and replace
    replacements = [
        (r'budget_plan', 'budget'),
        (r'BudgetPlan', 'Budget'),
        (r'budget-plan', 'budget'),
        (r'/budget-plan/', '/budget/'),
        (r'budget_plans', 'budgets'),
        (r'app\.routers\.budget_plan', 'app.routers.budget'),
        (r'app\.schemas\.budget_plan', 'app.schemas.budget'),
        (r'app\.services\.budget_plan_service', 'app.services.budget_service'),
        (r'from.*budget_plan.*import', 'from app.routers.budget import'),
        (r'import.*budget_plan', 'import app.routers.budget'),
    ]
    
    # Files to search in
    script_dir = Path(__file__).parent
    search_paths = [
        script_dir / "app" / "routers",
        script_dir / "app" / "services", 
        script_dir / "app" / "main.py",
        script_dir / "app" / "__init__.py",
    ]
    
    updated_files = []
    
    for search_path in search_paths:
        if search_path.is_file():
            # Single file
            for pattern, replacement in replacements:
                if search_and_replace_in_file(str(search_path), pattern, replacement):
                    if str(search_path) not in updated_files:
                        updated_files.append(str(search_path))
        elif search_path.is_dir():
            # Directory - search Python files
            for py_file in search_path.rglob("*.py"):
                for pattern, replacement in replacements:
                    if search_and_replace_in_file(str(py_file), pattern, replacement):
                        if str(py_file) not in updated_files:
                            updated_files.append(str(py_file))
    
    print(f"\n✅ Updated {len(updated_files)} files with budget_plan → budget replacements")
    for file_path in updated_files:
        print(f"  - {file_path}")

def cleanup_deprecated_modules():
    """Main cleanup function"""
    print("=== FinVerse Module Cleanup Tool ===")
    print("This will remove deprecated modules that have been replaced.")
    print("Backups will be created before deletion.")
    print()
    
    # Get the script directory
    script_dir = Path(__file__).parent
    
    # List of deprecated files to remove
    deprecated_files = [
        # Budget Plan modules (completely replaced)
        (script_dir / "app" / "routers" / "budget_plan.py", "Budget Plan router"),
        (script_dir / "app" / "schemas" / "budget_plan.py", "Budget Plan schemas"),
        (script_dir / "app" / "services" / "budget_plan_service.py", "Budget Plan service"),
        (script_dir / "app" / "models" / "budget_plan.py", "Budget Plan model"),
        
        # Duplicate budget router (consolidated into budget.py)
        (script_dir / "app" / "routers" / "budgets.py", "Duplicate budget router"),
        
        # Plural named files (rename to singular) - optional removal
        (script_dir / "app" / "routers" / "transactions.py", "Plural named transactions router"),
        (script_dir / "app" / "routers" / "categories.py", "Plural named categories router"),
        (script_dir / "app" / "routers" / "users.py", "Plural named users router"),
        (script_dir / "app" / "routers" / "financial_accounts.py", "Plural named financial accounts router"),
    ]
    
    # Confirm with user
    response = input("Do you want to proceed with cleanup? (y/n): ")
    if response.lower() not in ('y', 'yes'):
        print("Cleanup aborted.")
        return
    
    print("\n🧹 Starting cleanup process...\n")
    
    removed_count = 0
    total_count = len(deprecated_files)
    
    # Remove deprecated files
    for file_path, description in deprecated_files:
        if remove_deprecated_file(str(file_path), description):
            removed_count += 1
    
    # Search and replace budget_plan references
    cleanup_budget_plan_references()
    
    print(f"\n✅ Cleanup complete!")
    print(f"   Files processed: {total_count}")
    print(f"   Files removed: {removed_count}")
    print("\n📋 Next steps:")
    print("   1. Test your application to ensure everything works")
    print("   2. Update any remaining import statements in your code")
    print("   3. Test /budget endpoints work correctly")
    print("   4. Remove .backup files once you're satisfied")
    print("   5. Commit the changes to version control")

def restore_backups():
    """Restore backed up files if needed"""
    print("=== Restore Backup Files ===")
    script_dir = Path(__file__).parent
    
    backup_files = list(script_dir.rglob("*.backup"))
    
    if not backup_files:
        print("No backup files found.")
        return
    
    print(f"Found {len(backup_files)} backup files:")
    for backup in backup_files:
        print(f"  - {backup}")
    
    response = input("\nDo you want to restore all backup files? (y/n): ")
    if response.lower() not in ('y', 'yes'):
        print("Restore aborted.")
        return
    
    restored_count = 0
    for backup in backup_files:
        original = str(backup).replace(".backup", "")
        try:
            shutil.move(str(backup), original)
            print(f"  ✅ Restored: {original}")
            restored_count += 1
        except Exception as e:
            print(f"  ❌ Failed to restore {original}: {e}")
    
    print(f"\n✅ Restored {restored_count} files.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--restore":
        restore_backups()
    else:
        cleanup_deprecated_modules()

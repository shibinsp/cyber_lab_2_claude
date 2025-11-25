"""
Database Connection Test Script
This script tests the PostgreSQL connection and displays database information
"""

import sys
from sqlalchemy import create_engine, text, inspect
from app.config import DATABASE_URL

def test_connection():
    print("=" * 70)
    print("🔍 ISC Cyber Range - PostgreSQL Database Connection Test")
    print("=" * 70)
    print(f"\n📋 Connection Details:")
    print(f"   Database URL: {DATABASE_URL.replace('shibin', '****')}")
    
    try:
        # Create engine
        print("\n⏳ Attempting to connect to PostgreSQL...")
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ Connection successful!")
            print(f"\n📊 PostgreSQL Version:")
            print(f"   {version}")
            
            # Check if database exists and get info
            result = conn.execute(text("SELECT current_database(), current_user;"))
            db_info = result.fetchone()
            print(f"\n🗄️  Database Information:")
            print(f"   Current Database: {db_info[0]}")
            print(f"   Current User: {db_info[1]}")
            
            # Check existing tables
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print(f"\n📋 Existing Tables ({len(tables)}):")
            if tables:
                for table in tables:
                    print(f"   • {table}")
            else:
                print("   ℹ️  No tables found (database is empty)")
            
            print("\n" + "=" * 70)
            print("✅ Database connection test PASSED!")
            print("=" * 70)
            return True
            
    except Exception as e:
        print(f"\n❌ Connection failed!")
        print(f"   Error: {str(e)}")
        print("\n💡 Troubleshooting steps:")
        print("   1. Ensure PostgreSQL is running: sudo systemctl status postgresql")
        print("   2. Check if database exists: psql -U postgress -l")
        print("   3. Create database if needed: psql -U postgress -c 'CREATE DATABASE cyberlab;'")
        print("   4. Verify credentials in app/config.py")
        print("\n" + "=" * 70)
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)


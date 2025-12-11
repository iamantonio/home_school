import socket
import os
from urllib.parse import urlparse

def test_connection():
    env_path = '.env'
    db_url = None
    
    # Simple .env parser since we don't want to rely on python-dotenv
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    # Strip quotes if present
                    db_url = line.split('=', 1)[1].strip().strip('"').strip("'")
                    break
    
    if not db_url:
        print("Error: Could not find DATABASE_URL in .env")
        return

    # Hardcode test for the direct connection string to verify DNS again
    host = "db.vygtkvpzzxmvvisfqfdd.supabase.co"
    port = 5432
    print(f"Testing connectivity to DIRECT host {host}:{port}...")
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            print(f"✅ SUCCESS: Could reach {host} on port {port}.")
            print("The network connection is open. If Prisma still fails, check credentials or SSL mode.")
        else:
            print(f"❌ FAILURE: Could not connect to {host} on port {port}. Error code: {result}")
            print("Possible causes:")
            print("1. The Supabase project is paused (check dashboard).")
            print("2. Your network/firewall blocks this port.")
            print("3. The hostname is incorrect.")
            
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_connection()

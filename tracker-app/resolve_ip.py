import socket
try:
    ip = socket.gethostbyname('aws-0-us-west-2.pooler.supabase.com')
    print(ip)
except Exception as e:
    print(f"Error: {e}")

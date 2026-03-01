import os
import multiprocessing

# Server socket
bind = f"0.0.0.0:{os.environ.get('PORT', '5000')}"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, to help limit memory leaks
max_requests = 1000
max_requests_jitter = 100

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Process naming
proc_name = 'freshloop-api'

# Server mechanics
daemon = False
pidfile = '/tmp/gunicorn.pid'
tmp_upload_dir = None

# SSL (for HTTPS, if needed)
# keyfile = None
# certfile = None
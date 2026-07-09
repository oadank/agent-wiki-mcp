#!/bin/bash
cd /opt/agent-wiki-mcp
/usr/bin/python3 .pgvector/wiki-pgvector.py incremental >> /var/log/wiki-incremental.log 2>&1

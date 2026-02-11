#!/usr/bin/env python3
"""
ChatGPT Export Organizer
Organizes exported .md, .html, and .json files into a clean folder structure.

Usage:
    python organize_exports.py [source_folder]
    
If no source folder specified, uses current directory.

Creates:
    Archives/
    ├── Conversation_Name_1/
    │   ├── conversation.md
    │   ├── conversation.html
    │   └── conversation.json
    ├── Conversation_Name_2/
    │   ├── conversation.md
    │   ├── conversation.html
    │   └── conversation.json
    └── ...
"""

import os
import sys
import re
import shutil
from pathlib import Path
from collections import defaultdict

def extract_conversation_name(filename):
    """Extract the conversation name from a ChatGPT export filename."""
    # Pattern: ChatGPT_Conversation_Name_2026-02-11.ext
    match = re.match(r'ChatGPT_(.+?)_\d{4}-\d{2}-\d{2}\.(md|html|json)$', filename)
    if match:
        return match.group(1), match.group(2)
    return None, None

def organize_exports(source_dir='.'):
    """Organize ChatGPT exports into Archives folder structure."""
    source_path = Path(source_dir).resolve()
    archives_path = source_path / 'Archives'
    
    print(f"📁 Scanning: {source_path}")
    print(f"📦 Archives folder: {archives_path}\n")
    
    # Find all ChatGPT export files
    exports = defaultdict(dict)
    
    for file in source_path.iterdir():
        if file.is_file():
            name, ext = extract_conversation_name(file.name)
            if name and ext:
                exports[name][ext] = file
    
    if not exports:
        print("❌ No ChatGPT export files found!")
        print("   Looking for files matching: ChatGPT_*_YYYY-MM-DD.(md|html|json)")
        return
    
    print(f"📊 Found {len(exports)} conversations:\n")
    
    # Create Archives folder
    archives_path.mkdir(exist_ok=True)
    
    # Organize each conversation
    moved_count = 0
    for conv_name, files in sorted(exports.items()):
        # Create conversation folder
        conv_folder = archives_path / conv_name
        conv_folder.mkdir(exist_ok=True)
        
        print(f"📂 {conv_name}/")
        
        # Move each file type
        for ext, source_file in files.items():
            dest_file = conv_folder / f"conversation.{ext}"
            
            # Handle existing files
            if dest_file.exists():
                print(f"   ⚠️  conversation.{ext} already exists, skipping")
                continue
            
            shutil.move(str(source_file), str(dest_file))
            print(f"   ✅ conversation.{ext}")
            moved_count += 1
    
    print(f"\n🎉 Done! Organized {moved_count} files into {len(exports)} folders.")
    print(f"📁 Archives location: {archives_path}")

def main():
    source = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    if not os.path.isdir(source):
        print(f"❌ Error: '{source}' is not a valid directory")
        sys.exit(1)
    
    organize_exports(source)

if __name__ == '__main__':
    main()

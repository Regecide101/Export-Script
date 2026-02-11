#!/usr/bin/env python3
"""
ChatGPT Export Organizer
Just double-click or run - organizes files in the same folder as this script.
"""

import os
import re
import shutil
from pathlib import Path
from collections import defaultdict

def extract_conversation_name(filename):
    """Extract the conversation name from a ChatGPT export filename."""
    match = re.match(r'ChatGPT_(.+?)_\d{4}-\d{2}-\d{2}\.(md|html|json)$', filename)
    if match:
        return match.group(1), match.group(2)
    return None, None

def organize_exports():
    """Organize ChatGPT exports into Archives folder structure."""
    # Always use the folder where THIS SCRIPT lives
    source_path = Path(__file__).parent.resolve()
    archives_path = source_path / 'Archives'
    
    print(f"\n📁 Scanning: {source_path}")
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
        input("\nPress Enter to exit...")
        return
    
    print(f"📊 Found {len(exports)} conversations:\n")
    
    # Create Archives folder
    archives_path.mkdir(exist_ok=True)
    
    # Organize each conversation
    moved_count = 0
    for conv_name, files in sorted(exports.items()):
        conv_folder = archives_path / conv_name
        conv_folder.mkdir(exist_ok=True)
        
        print(f"📂 {conv_name}/")
        
        for ext, source_file in files.items():
            dest_file = conv_folder / f"conversation.{ext}"
            
            if dest_file.exists():
                print(f"   ⚠️  conversation.{ext} already exists, skipping")
                continue
            
            shutil.move(str(source_file), str(dest_file))
            print(f"   ✅ conversation.{ext}")
            moved_count += 1
    
    print(f"\n🎉 Done! Organized {moved_count} files into {len(exports)} folders.")
    print(f"📁 Archives location: {archives_path}")
    input("\nPress Enter to exit...")

if __name__ == '__main__':
    organize_exports()

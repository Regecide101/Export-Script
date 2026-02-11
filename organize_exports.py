#!/usr/bin/env python3
"""
ChatGPT Export Organizer v2.0
Organizes exported .md, .html, .json files AND images into a clean folder structure.

Usage:
    python organize_exports.py [source_folder]
    
If no source folder specified, uses current directory.

Creates:
    Archives/
    ├── Conversation_Name_1/
    │   ├── conversation.md
    │   ├── conversation.html
    │   ├── conversation.json
    │   └── images/
    │       ├── image_001.png
    │       ├── image_002.jpg
    │       └── ...
    ├── Conversation_Name_2/
    │   └── ...
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
        return match.group(1), match.group(2), None
    
    # Pattern: ChatGPT_Conversation_Name_2026-02-11_image_001.ext
    match = re.match(r'ChatGPT_(.+?)_\d{4}-\d{2}-\d{2}_image_(\d+)\.(png|jpg|jpeg|gif|webp)$', filename)
    if match:
        return match.group(1), 'image', match.group(0)  # Return full filename for images
    
    return None, None, None

def organize_exports(source_dir='.'):
    """Organize ChatGPT exports into Archives folder structure."""
    source_path = Path(source_dir).resolve()
    archives_path = source_path / 'Archives'
    
    print(f"📁 Scanning: {source_path}")
    print(f"📦 Archives folder: {archives_path}\n")
    
    # Find all ChatGPT export files
    exports = defaultdict(lambda: {'files': {}, 'images': []})
    
    for file in source_path.iterdir():
        if file.is_file():
            name, file_type, original_name = extract_conversation_name(file.name)
            if name and file_type:
                if file_type == 'image':
                    exports[name]['images'].append(file)
                else:
                    exports[name]['files'][file_type] = file
    
    if not exports:
        print("❌ No ChatGPT export files found!")
        print("   Looking for files matching: ChatGPT_*_YYYY-MM-DD.(md|html|json)")
        print("   And images matching: ChatGPT_*_YYYY-MM-DD_image_###.(png|jpg|gif|webp)")
        return
    
    # Count totals
    total_files = sum(len(e['files']) for e in exports.values())
    total_images = sum(len(e['images']) for e in exports.values())
    
    print(f"📊 Found {len(exports)} conversations:")
    print(f"   📄 {total_files} text files (md/html/json)")
    print(f"   🖼️  {total_images} images\n")
    
    # Create Archives folder
    archives_path.mkdir(exist_ok=True)
    
    # Organize each conversation
    moved_files = 0
    moved_images = 0
    
    for conv_name, data in sorted(exports.items()):
        files = data['files']
        images = data['images']
        
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
            moved_files += 1
        
        # Move images
        if images:
            images_folder = conv_folder / 'images'
            images_folder.mkdir(exist_ok=True)
            
            for img_file in sorted(images):
                # Extract just the image_XXX.ext part
                match = re.search(r'(image_\d+\.\w+)$', img_file.name)
                if match:
                    new_name = match.group(1)
                else:
                    new_name = img_file.name
                
                dest_file = images_folder / new_name
                
                if dest_file.exists():
                    print(f"   ⚠️  images/{new_name} already exists, skipping")
                    continue
                
                shutil.move(str(img_file), str(dest_file))
                moved_images += 1
            
            print(f"   🖼️  {len(images)} images → images/")
    
    print(f"\n{'='*50}")
    print(f"🎉 DONE!")
    print(f"   📄 Organized {moved_files} files")
    print(f"   🖼️  Organized {moved_images} images")
    print(f"   📂 Into {len(exports)} conversation folders")
    print(f"\n📁 Archives location: {archives_path}")

def main():
    source = sys.argv[1] if len(sys.argv) > 1 else '.'
    
    if not os.path.isdir(source):
        print(f"❌ Error: '{source}' is not a valid directory")
        sys.exit(1)
    
    organize_exports(source)
    
    input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()

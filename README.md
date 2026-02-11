# Export-Script

A simple Python script to export GPT conversations because OpenAI doesn't provide a direct export feature.

## Description

This script allows you to export GPT conversations to JSON format for archival, analysis, or backup purposes.

## Structure

```
Export-Script/
├── src/
│   └── export_script.py    # Main export script
├── .gitignore
└── README.md
```

## Requirements

- Python 3.6 or higher
- No external dependencies required (uses only standard library)

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Regecide101/Export-Script.git
cd Export-Script
```

2. Make the script executable (optional):
```bash
chmod +x src/export_script.py
```

## Usage

### Basic Usage

Run the script directly:
```bash
python3 src/export_script.py
```

### Importing and Using in Your Code

```python
from src.export_script import export_conversation

# Prepare your conversation data
conversation = {
    "title": "My Conversation",
    "date": "2026-02-11",
    "messages": [
        {"role": "user", "content": "Hello!"},
        {"role": "assistant", "content": "Hi! How can I help you today?"}
    ]
}

# Export the conversation
export_conversation(conversation)
```

The exported conversations will be saved in the `exports/` directory with timestamps.

## Output Format

Conversations are exported as JSON files with the following naming convention:
```
conversation_export_YYYYMMDD_HHMMSS.json
```

## License

This project is provided as-is for personal use.

## Contributing

Feel free to submit issues or pull requests to improve this script.

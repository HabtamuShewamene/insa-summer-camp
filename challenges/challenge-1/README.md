# Challenge 1: Environment Setup Verification

This challenge verifies that your development environment is properly configured with the necessary tools for the summer camp challenges.

## Overview

The `env_proof.py` script checks and displays information about your development environment, including:

- Your name (personalized)
- Current date
- Python version
- Node.js version and availability

## Prerequisites

Before running this challenge, ensure you have:

- **Python 3.x** installed on your system
- **Node.js** installed (optional but recommended for upcoming challenges)

## Setup Instructions

### 1. Personalize the Script

Open `env_proof.py` and update the `NAME` variable with your actual name:

```python
NAME = "Your Full Name"  # Replace with your name
```

### 2. Run the Script

Execute the environment verification script:

```bash
python env_proof.py
```

## Expected Output

When run successfully, you should see output similar to:

```
Name: Your Full Name
Date: 2026-07-29
Python: 3.11.4
Node: v18.17.0
```

**Note:** If Node.js is not installed, you'll see:
```
Node: Node.js not installed
```

## Troubleshooting

### Python Issues
- **Command not found**: Ensure Python is installed and added to your system PATH
- **Permission denied**: On Unix systems, you may need to use `python3` instead of `python`

### Node.js Issues
- **Not installed**: Download and install Node.js from [nodejs.org](https://nodejs.org/)
- **Version not detected**: Ensure Node.js is properly added to your system PATH

### Windows-Specific
- Use Command Prompt or PowerShell
- If using Python from Microsoft Store, use `python` command
- If using system Python, you might need `py` command

### macOS/Linux-Specific
- You may need to use `python3` instead of `python`
- Ensure both Python and Node.js are in your `$PATH`

## What This Challenge Teaches

1. **Environment verification**: How to programmatically check tool availability
2. **Cross-platform scripting**: Using Python's standard library for system information
3. **Subprocess management**: Running external commands safely
4. **Error handling**: Graceful handling of missing dependencies

## Next Steps

Once your environment verification passes:

1. ✅ Confirm Python is working correctly
2. ✅ Verify Node.js installation (if needed for subsequent challenges)
3. ✅ Proceed to Challenge 2

## Files in this Challenge

- `env_proof.py` - Main environment verification script
- `README.md` - This documentation file

---

**Summer Camp Challenge Series**  
*Challenge 1 of N - Environment Setup*
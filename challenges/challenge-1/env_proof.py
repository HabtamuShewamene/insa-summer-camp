from datetime import date
import platform
import shutil
import subprocess

NAME = "Habtamu Shewamene "  # change this

def get_node_version():
    if shutil.which("node") is None:
        return "Node.js not installed"
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except Exception:
        return "Node.js version could not be detected"

def main():
    print(f"Name: {NAME}")
    print(f"Date: {date.today().isoformat()}")
    print(f"Python: {platform.python_version()}")
    print(f"Node: {get_node_version()}")

if __name__ == "__main__":
    main()
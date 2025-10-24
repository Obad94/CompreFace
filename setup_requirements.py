import subprocess
import sys

def install_requirements():
    """Install required packages"""
    packages = ['requests', 'Pillow']
    
    for package in packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError:
            print(f"❌ Failed to install {package}")

if __name__ == "__main__":
    print("🚀 Setting up Batch Face Processor...")
    install_requirements()
    print("✅ Setup complete!")
from constants import (
    GITHUB_EMAIL,
    GITHUB_USERNAME,
)
from variables import GITHUB_PAT_TOKEN

user_data_script = f"""#!/bin/bash
   #!/bin/bash
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

    # Update and upgrade apt packages
    echo "Updating and upgrading apt packages..."
    apt-get update
    apt-get upgrade -y

    # Install Node.js from Nodesource
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs

    # Verify Node.js and npm installation
    echo "Node.js version:"
    node --version
    echo "npm version:"
    npm --version

    # Install bun
    echo "Installing bun..."
    sudo npm i -g bun

    # Install git and other necessary packages
    echo "Installing git..."
    apt-get install -y git

    # Configure git with your name and email
    # echo "Configuring git..."
    git config --global user.name "{GITHUB_USERNAME}"
    git config --global user.email "{GITHUB_EMAIL}"

    # Log in to Git using PAT
    # echo "Logging in to Git with PAT..."
    git clone https://hunkydoris:{GITHUB_PAT_TOKEN}@github.com/hunkydoris/cloud-security-spring-2024-ics.git repo
    
    cd repo
    
    bun install
    bun run build
    bun run start:ec2

    echo "Installation and cloning complete."
    """


print(user_data_script)


# git clone https://hunkydoris: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@github.com/DEEP-24/hms-cloud-security.git repo

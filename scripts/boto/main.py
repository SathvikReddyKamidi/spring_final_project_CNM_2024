import os

import boto3

from constants import (
    DB_ALLOCATION_STORAGE,
    DB_ENGINE,
    DB_ENGINE_VERSION,
    DB_INSTANCE_CLASS,
    DB_INSTANCE_IDENTIFIER,
    DB_NAME,
    DB_PASSWORD,
    DB_PORT,
    DB_USERNAME,
    GITHUB_EMAIL,
    GITHUB_USERNAME,
    IMAGE_ID,
    INSTANCE_NAME,
    INSTANCE_TYPE,
    KEY_PAIR_NAME,
    SECURITY_GROUP_NAME,
)
from variables import (
    AWS_ACCESS_KEY_ID,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    DATABASE_URL,
    EC2_INSTANCE_ID,
    GITHUB_PAT_TOKEN,
    SECURITY_GROUP_ID,
    is_env_var_set,
    update_env,
)

ec2_client = boto3.client(
    "ec2",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)

rds_client = boto3.client(
    "rds",
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)


def find_default_vpc():
    vpcs = ec2_client.describe_vpcs(Filters=[{"Name": "isDefault", "Values": ["true"]}])
    return vpcs["Vpcs"][0]["VpcId"] if vpcs["Vpcs"] else None


def create_security_group(vpc_id):
    response = ec2_client.create_security_group(
        GroupName=SECURITY_GROUP_NAME,
        Description="Security Group for RDS, EC2 Instances, and SSH Access",
        VpcId=vpc_id,
    )
    security_group_id = response["GroupId"]

    ip_permissions = [
        {
            "IpProtocol": "tcp",
            "FromPort": DB_PORT,
            "ToPort": DB_PORT,
            "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
        },
        {
            "IpProtocol": "tcp",
            "FromPort": 3000,
            "ToPort": 3000,
            "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
        },
        {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "IpRanges": [{"CidrIp": "0.0.0.0/0"}],
        },
    ]

    ec2_client.authorize_security_group_ingress(
        GroupId=security_group_id, IpPermissions=ip_permissions
    )
    return security_group_id


def create_rds_instance(security_group_id):
    response = rds_client.create_db_instance(
        DBName=DB_NAME,
        DBInstanceIdentifier=DB_INSTANCE_IDENTIFIER,
        AllocatedStorage=DB_ALLOCATION_STORAGE,
        DBInstanceClass=DB_INSTANCE_CLASS,
        Engine=DB_ENGINE,
        EngineVersion=DB_ENGINE_VERSION,
        MasterUsername=DB_USERNAME,
        MasterUserPassword=DB_PASSWORD,
        VpcSecurityGroupIds=[security_group_id],
        Port=DB_PORT,
        MultiAZ=False,
        PubliclyAccessible=True,
        StorageType="gp2",
        Tags=[{"Key": "Name", "Value": "my-db-instance"}],
    )
    return response["DBInstance"]["DBInstanceIdentifier"]


def get_db_instance_url(db_instance_identifier):
    waiter = rds_client.get_waiter("db_instance_available")
    waiter.wait(DBInstanceIdentifier=db_instance_identifier)
    response = rds_client.describe_db_instances(
        DBInstanceIdentifier=db_instance_identifier
    )
    db_instance = response["DBInstances"][0]
    db_endpoint = db_instance["Endpoint"]["Address"]
    return f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{db_endpoint}:{DB_PORT}/{DB_NAME}"


def create_key_pair(ec2_client):
    key_pair = ec2_client.create_key_pair(KeyName=KEY_PAIR_NAME)
    private_key = key_pair["KeyMaterial"]

    file_path = f"{KEY_PAIR_NAME}.pem"
    with open(file_path, "w") as pem_file:
        pem_file.write(private_key)

    os.chmod(file_path, 0o400)
    print(f"Permissions set: {file_path} is now read-only for the owner.")

    return KEY_PAIR_NAME


def create_ec2_instance(ec2_client, security_group_id):
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
    # git config --global user.name "{GITHUB_USERNAME}"
    # git config --global user.email "{GITHUB_EMAIL}"

    # Log in to Git using PAT
    echo "Logging in to Git with PAT..."
    
    cd home/ubuntu
    
    git clone https://SathvikReddyKamidi:{GITHUB_PAT_TOKEN}@github.com/SathvikReddyKamidi/spring_final_project_20204.git repo
    echo "Installation and cloning complete."
    
    # cd repo
    
    # bun install
    """

    instances = ec2_client.run_instances(
        ImageId=IMAGE_ID,
        InstanceType=INSTANCE_TYPE,
        MaxCount=1,
        MinCount=1,
        KeyName=KEY_PAIR_NAME,
        SecurityGroupIds=[security_group_id],
        UserData=user_data_script,
        TagSpecifications=[
            {
                "ResourceType": "instance",
                "Tags": [{"Key": "Name", "Value": INSTANCE_NAME}],
            }
        ],
    )
    instance_id = instances["Instances"][0]["InstanceId"]
    print("Waiting for instance to be in running state...")
    waiter = ec2_client.get_waiter("instance_running")
    waiter.wait(InstanceIds=[instance_id])

    print("Waiting for instance status checks to pass...")
    waiter = ec2_client.get_waiter("instance_status_ok")
    waiter.wait(InstanceIds=[instance_id])

    described_instance = ec2_client.describe_instances(InstanceIds=[instance_id])
    public_ip = described_instance["Reservations"][0]["Instances"][0]["PublicIpAddress"]

    print(f"EC2 SSH: ssh -i {KEY_PAIR_NAME}.pem ubuntu@{public_ip}")
    print(f"Website URL: http://{public_ip}:3000")

    return instance_id


def main():
    vpc_id = find_default_vpc()
    print("Default VPC ID:", vpc_id)

    security_group_id = SECURITY_GROUP_ID
    if not is_env_var_set(security_group_id):
        security_group_id = create_security_group(vpc_id)
        update_env("SECURITY_GROUP_ID", security_group_id)
        print("Security Group ID:", security_group_id)
    else:
        print("Security Group ID:", security_group_id)

    database_url = DATABASE_URL
    if not is_env_var_set(database_url):
        db_instance_identifier = create_rds_instance(security_group_id)
        database_url = get_db_instance_url(db_instance_identifier)
        update_env("DATABASE_URL", database_url)
        print("Database URL:", database_url)
    else:
        print("Database URL:", database_url)

    ec2_instance_id = EC2_INSTANCE_ID
    if not is_env_var_set(ec2_instance_id):
        if not os.path.exists(f"{KEY_PAIR_NAME}.pem"):
            create_key_pair(ec2_client)
            print(f"Key Pair {KEY_PAIR_NAME}.pem created.")

        instance_id = create_ec2_instance(ec2_client, security_group_id)
        update_env("EC2_INSTANCE_ID", instance_id)
        print("EC2 Instance ID:", instance_id)
    else:
        print("EC2 Instance ID:", ec2_instance_id)


if __name__ == "__main__":
    main()

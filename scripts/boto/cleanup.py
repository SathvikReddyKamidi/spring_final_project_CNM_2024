import boto3

from constants import DB_INSTANCE_IDENTIFIER
from variables import (
    AWS_ACCESS_KEY_ID,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    DATABASE_URL,
    EC2_INSTANCE_ID,
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


def delete_rds_instance(db_instance_identifier):
    try:
        rds_client.delete_db_instance(
            DBInstanceIdentifier=db_instance_identifier,
            SkipFinalSnapshot=True,
            DeleteAutomatedBackups=True,
        )
        waiter = rds_client.get_waiter("db_instance_deleted")
        waiter.wait(DBInstanceIdentifier=db_instance_identifier)
        print(f"Deleted RDS instance: {db_instance_identifier}")
    except Exception as e:
        print(f"Error deleting RDS instance: {e}")


def delete_ec2_instance(instance_id):
    try:
        ec2_resource = boto3.resource("ec2")
        instance = ec2_resource.Instance(instance_id)

        print(f"Terminating EC2 instance: {instance_id}")
        instance.terminate()

        # Wait for the instance to be terminated
        instance.wait_until_terminated()
        print(f"EC2 instance terminated: {instance_id}")
    except Exception as e:
        print(f"Error deleting EC2 instance: {e}")


def delete_security_group(security_group_id):
    try:
        ec2_client.delete_security_group(GroupId=security_group_id)
        print(f"Deleted security group: {security_group_id}")
    except Exception as e:
        print(f"Error deleting security group: {e}")


def main():
    db_instance_identifier = DB_INSTANCE_IDENTIFIER
    db_url = DATABASE_URL
    if not is_env_var_set(db_instance_identifier) or not is_env_var_set(db_url):
        print("DATABASE_URL is not set. Please set it in the .env file.")
    else:
        print(f"Deleting RDS instance with identifier: {db_instance_identifier}")
        delete_rds_instance(db_instance_identifier)
        update_env("DATABASE_URL", "")
        print(
            f"RDS instance with identifier {db_instance_identifier} deleted successfully."
        )

    ec2_instance_id = EC2_INSTANCE_ID
    if not is_env_var_set(ec2_instance_id):
        print("EC2_INSTANCE_ID is not set. Please set it in the .env file.")
    else:
        print(f"Deleting EC2 instance with ID: {ec2_instance_id}")
        delete_ec2_instance(ec2_instance_id)
        update_env("EC2_INSTANCE_ID", "")
        print(f"EC2 instance with ID {ec2_instance_id} deleted successfully.")

    security_group_id = SECURITY_GROUP_ID
    if not is_env_var_set(security_group_id):
        print("SECURITY_GROUP_ID is not set. Please set it in the .env file.")
    else:
        print(f"Deleting security group with ID: {security_group_id}")
        delete_security_group(security_group_id)
        update_env("SECURITY_GROUP_ID", "")
        print(f"Security group with ID {security_group_id} deleted successfully.")


if __name__ == "__main__":
    main()

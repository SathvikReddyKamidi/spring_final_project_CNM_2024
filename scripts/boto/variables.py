import os

from dotenv import load_dotenv, set_key


env_file_path = ".env"
load_dotenv(env_file_path)

# Common AWS
AWS_REGION = os.getenv("AWS_REGION")

# AWS IAM
AWS_ACCOUNT_ID = os.getenv("AWS_ACCOUNT_ID")
IAM_USER_NAME = os.getenv("IAM_USER_NAME")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Github
GITHUB_PAT_TOKEN = os.getenv("GITHUB_PAT_TOKEN")

# VPC
SECURITY_GROUP_ID = os.getenv("SECURITY_GROUP_ID")

# RDS
DATABASE_URL = os.getenv("DATABASE_URL")

# EC2
EC2_INSTANCE_ID = os.getenv("EC2_INSTANCE_ID")


def update_env(key, value):
    set_key(env_file_path, key, value)


def is_env_var_set(env_var):
    return env_var and env_var.strip() != ""

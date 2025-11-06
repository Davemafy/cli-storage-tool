#!/bin/bash

# --- Configuration ---
# NOTE: The BUCKET_NAME must be unique globally across S3.
# The 'deploy' command will generate a unique name if this is empty.
S3_BUCKET_NAME="my-simple-cloud-storage-1762449781"
REGION="eu-north-1" 
LOG_FILE="storage_activity.log"
# ---------------------

# --- Helper Function: Logging (Bonus) ---
log_activity() {
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    echo "[$TIMESTAMP] $1" | tee -a $LOG_FILE
}

# --- Task 1: Deployment Functions ---

# Function to create the unique bucket name
generate_bucket_name() {
    echo "my-simple-cloud-storage-$(date +%s)"
}

# Function to create the S3 bucket and set public access
deploy_storage() {
    S3_BUCKET_NAME=$(generate_bucket_name)

    log_activity "--- Starting Deployment ---"
    echo "--- 1. Creating S3 Bucket: $S3_BUCKET_NAME in $REGION ---"

    # Create the bucket
    aws s3 mb s3://$S3_BUCKET_NAME --region $REGION

    if [ $? -ne 0 ]; then
        log_activity "ERROR: Failed to create S3 bucket $S3_BUCKET_NAME."
        echo "Error: Failed to create S3 bucket. Check AWS CLI configuration/permissions."
        exit 1
    fi

    echo "--- 2. Setting Block Public Access to allow Public Read Access ---"
    # Disable all Block Public Access settings
    aws s3api put-public-access-block \
        --bucket $S3_BUCKET_NAME \
        --public-access-block-configuration '{"BlockPublicAcls": false, "IgnorePublicAcls": false, "BlockPublicPolicy": false, "RestrictPublicBuckets": false}'

    echo "--- 3. Applying Bucket Policy for Public Read Access ---"
    # Bucket Policy JSON (allows s3:GetObject for all users)
    POLICY='{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadAccess",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'$S3_BUCKET_NAME'/*"
            }
        ]
    }'

    # Apply the policy
    aws s3api put-bucket-policy \
        --bucket $S3_BUCKET_NAME \
        --policy "$POLICY"

    log_activity "SUCCESS: Deployment complete. Bucket: $S3_BUCKET_NAME"
    echo "--- Deployment Complete! ---"
    echo "✅ New Bucket Name: $S3_BUCKET_NAME"
    echo "⚠️ Action Required: Copy this name and paste it into the S3_BUCKET_NAME variable at the top of this script for file management."
    echo "Run the script again with 'deploy' to check the name if you lose it."
}

# --- Task 2: File Management Functions ---

# Helper function to check if the bucket name is set
check_bucket_name() {
    if [ -z "$S3_BUCKET_NAME" ] || [ "$S3_BUCKET_NAME" == "YOUR_S3_BUCKET_NAME_HERE" ]; then
        echo "Error: BUCKET_NAME is not set in the script configuration."
        echo "First, run: $0 deploy"
        echo "Then, update the S3_BUCKET_NAME variable with the generated name."
        exit 1
    fi
}

# Function 1: Upload a file
upload_file() {
    check_bucket_name
    if [ -z "$1" ]; then
        log_activity "ERROR: Upload failed. No file path provided."
        echo "Usage: upload <local_file_path>"
        return 1
    fi

    LOCAL_FILE="$1"
    if [ ! -f "$LOCAL_FILE" ]; then
        log_activity "ERROR: Upload failed. File not found: $LOCAL_FILE"
        echo "Error: File not found: $LOCAL_FILE"
        return 1
    fi

    log_activity "Attempting UPLOAD of $LOCAL_FILE to s3://$S3_BUCKET_NAME"
    aws s3 cp "$LOCAL_FILE" s3://$S3_BUCKET_NAME/
    if [ $? -eq 0 ]; then
        log_activity "SUCCESS: Uploaded $LOCAL_FILE"
    else
        log_activity "FAILURE: Upload of $LOCAL_FILE failed."
    fi
}

# Function 2: Download a file
download_file() {
    check_bucket_name
    if [ -z "$1" ]; then
        log_activity "ERROR: Download failed. No remote file name provided."
        echo "Usage: download <remote_file_name> [local_destination_path]"
        return 1
    fi

    REMOTE_FILE="$1"
    LOCAL_DESTINATION="${2:-.}"

    log_activity "Attempting DOWNLOAD of $REMOTE_FILE from s3://$S3_BUCKET_NAME to $LOCAL_DESTINATION"
    aws s3 cp s3://$S3_BUCKET_NAME/"$REMOTE_FILE" "$LOCAL_DESTINATION/"
    if [ $? -eq 0 ]; then
        log_activity "SUCCESS: Downloaded $REMOTE_FILE"
    else
        log_activity "FAILURE: Download of $REMOTE_FILE failed."
    fi
}

# Function 3: List files
list_files() {
    check_bucket_name
    log_activity "Attempting LIST files in s3://$S3_BUCKET_NAME"
    echo "--- Files in S3 Bucket $S3_BUCKET_NAME ---"
    aws s3 ls s3://$S3_BUCKET_NAME/
    log_activity "SUCCESS: Listed files."
}

# Function 4: Delete a file
delete_file() {
    check_bucket_name
    if [ -z "$1" ]; then
        log_activity "ERROR: Delete failed. No remote file name provided."
        echo "Usage: delete <remote_file_name>"
        return 1
    fi

    REMOTE_FILE="$1"
    log_activity "Attempting DELETE of $REMOTE_FILE from s3://$S3_BUCKET_NAME"
    aws s3 rm s3://$S3_BUCKET_NAME/"$REMOTE_FILE"
    if [ $? -eq 0 ]; then
        log_activity "SUCCESS: Deleted $REMOTE_FILE"
    else
        log_activity "FAILURE: Delete of $REMOTE_FILE failed."
    fi
}

# --- Main CLI Interface ---

show_usage() {
    echo "Usage: $0 {deploy|upload|download|list|delete} [arguments]"
    echo ""
    echo "Commands:"
    echo "  deploy                           : Creates a new unique S3 bucket and configures public access."
    echo "  upload <local_file_path>         : Uploads a local file to the cloud storage."
    echo "  download <remote_file> [local_dir]: Downloads a file from the cloud storage."
    echo "  list                             : Lists all files in the cloud storage."
    echo "  delete <remote_file>             : Deletes a file from the cloud storage."
    exit 1
}

# Ensure script is executable
if [ ! -x "$0" ]; then
    echo "Making script executable..."
    chmod +x "$0"
fi

case "$1" in
    deploy)
        deploy_storage
        ;;
    upload)
        upload_file "$2"
        ;;
    download)
        download_file "$2" "$3"
        ;;
    list)
        list_files
        ;;
    delete)
        delete_file "$2"
        ;;
    *)
        show_usage
esac
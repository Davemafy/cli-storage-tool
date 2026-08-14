# Bucketroom — S3 Storage Tool

This project now has **two interfaces over Amazon S3**:

- `cloud_storage_cli.sh` — the original Bash/AWS CLI interface
- `web/` — a React + TypeScript interface deployed entirely on Vercel, with Vercel Functions generating short-lived S3 upload/download URLs

The web app can list, search, upload, download and delete objects without exposing AWS credentials in the browser. See [`web/README.md`](web/README.md) for deployment.

> The S3 provisioning workflow is manual (`workflow_dispatch`) so normal pushes do not create a new bucket. Vercel handles web deployments from Git.

---

# ☁️ Project 4: Simple Cloud-based File Storage (S3/Bash CLI)

## 🎯 Objectives

This project creates a single, self-contained Bash CLI tool to manage a simple cloud file storage system using **Amazon S3** and the **AWS CLI**.

The tool handles both the initial storage deployment and all subsequent file management operations (upload, download, list, delete).

## 🛠️ Technology Stack

  * **Cloud Provider:** Amazon Web Services (AWS)
  * **Storage Service:** Amazon Simple Storage Service (S3)
  * **Tools:** AWS CLI, Bash
  * **Automation:** GitHub Actions (for automated deployment)

## 📂 Repository Contents

| File Name | Description | Role |
| :--- | :--- | :--- |
| `cloud_storage_cli.sh` | **The single Bash script** handling **Deployment (Task 1)** and all **File Management (Task 2)** operations. | **Core Functionality** |
| `storage_activity.log` | Records every action (upload, download, list, delete) performed by the script. | **BONUS: Logging** |
| `.github/workflows/deploy.yml` | GitHub Actions workflow to automate the initial storage deployment. | **Automation** |

-----

## 🚀 Getting Started

### Prerequisites

1.  **AWS Account:** You need an active AWS account.
2.  **AWS CLI:** The AWS CLI must be installed and configured with IAM credentials that have permissions to manage S3 (create buckets and apply policies). Run `aws configure` to set this up.

### Step 1: Deployment (First Run)

The first time you run the script, use the `deploy` command to create the S3 bucket and configure public read access.

```bash
# Make the script executable
chmod +x cloud_storage_cli.sh

# Run the deployment command
./cloud_storage_cli.sh deploy
```

> ⚠️ **CRUCIAL STEP: Configuration Update**
>
> The deployment will output the **unique name** of the S3 bucket it created. You **must** copy this name and paste it into the `S3_BUCKET_NAME` variable at the top of the `cloud_storage_cli.sh` file to enable file operations.

### Step 2: File Management Usage

Once configured, use the script as a CLI tool for file operations.

| Command | Description | Example |
| :--- | :--- | :--- |
| **`list`** | Lists all files currently stored in the S3 bucket. | `./cloud_storage_cli.sh list` |
| **`upload`** | Uploads a local file to the cloud storage. | `./cloud_storage_cli.sh upload report.txt` |
| **`download`** | Downloads a file from the cloud storage to a local directory. | `./cloud_storage_cli.sh download report.txt ./downloads/` |
| **`delete`** | Permanently deletes a file from the cloud storage. | `./cloud_storage_cli.sh delete report.txt` |

### 📋 Logging (Bonus)

All operations are recorded with a timestamp and status in the `storage_activity.log` file, fulfilling the logging bonus requirement.

-----

## 🤖 Automating with GitHub Actions

The provided GitHub Actions workflow (`deploy.yml`) allows you to automate the initial **deployment** process.

**To enable this automation:**

1.  Go to your repository **Settings** \> **Secrets and variables** \> **Actions**.
2.  Add two repository secrets that hold your access credentials:
      * `AWS_ACCESS_KEY_ID`
      * `AWS_SECRET_ACCESS_KEY`

This workflow runs the `./cloud_storage_cli.sh deploy` command using your provided credentials whenever you push changes, ensuring your cloud storage is set up automatically.


---

## 🖥️ Bucketroom Web Interface

The project now also includes a browser interface in [`web/`](./web) while keeping the original Bash CLI intact.

The web app uses **React + TypeScript** on the frontend and **Node.js + Express + AWS SDK** on the server. It supports drag-and-drop upload, listing, search, download, delete and object metadata. AWS credentials remain server-side.

```bash
cd web
npm install
npm run dev
```

See [`web/README.md`](./web/README.md) for S3 configuration and deployment details.

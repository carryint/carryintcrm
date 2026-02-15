
# Carryint Shipping Services CRM

A professional cloud-based CRM and Invoicing system built for **Carryint Shipping Services L.L.C**.

## 🚀 Features
- **Tax Invoices**: Professional UAE-compliant invoices with VAT calculation.
- **Client Management**: Track credit/commercial and one-time customers.
- **Vendor Tracking**: Monitor shipment costs and vendor payables.
- **Profit Dashboard**: Real-time analysis of revenue vs. profit.
- **Data Export**: Download your entire system data as Excel or ZIP backups.

## 🛠️ Deployment to GitHub

To upload this code to your GitHub profile and deploy it, follow these steps:

### 1. Create a Repository
Go to [GitHub.com/new](https://github.com/new) and create a new repository named `carryint-crm`.

### 2. Push Code to GitHub
Open your terminal in the project folder and run:

```bash
# Initialize git
git init

# Add files
git add .
git commit -m "Initial commit of Carryint CRM"

# Link to your repository (Replace with your actual repo link if needed)
git remote add origin https://github.com/carryint/carryint-crm.git

# Push the code
git branch -M main
git push -u origin main
```

### 3. Deploy to GitHub Pages
To make the site live at `https://carryint.github.io/carryint-crm`:

```bash
# Install dependencies
npm install

# Run the deploy script
npm run deploy
```

## 🔒 Data Privacy
This application is designed as a **Privacy-First** tool. All customer data, invoices, and settings are stored locally in your browser's storage. No data is sent to external servers unless you manually export it.

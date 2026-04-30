# Tech Odyssey Magazine Generator

Tech Odyssey Magazine Generator is a full-stack web application designed to automate the process of collecting, reviewing, and publishing departmental or college-wide magazines. It features a robust automated PDF generation pipeline and tailored dashboards for different roles, including Students, Faculty members, and Lab Assistants.

## 🚀 Features

- **Automated PDF Generation**: Seamlessly generate high-quality PDF magazines using Puppeteer, fully incorporating custom configurations like Principal and HOD messages, profile photos, and student achievements tables.
- **Role-Based Access Control (RBAC)**: Secure access tailored to specific roles:
  - **Students**: Submit articles, project details, and achievements.
  - **Faculty**: Review and approve student submissions via a dedicated Faculty Review Board.
  - **Lab Assistants / Admins**: Manage magazine configurations, including multi-departmental settings, and oversee the final publication pipeline.
- **Dynamic Magazine Configuration**: Easily add custom input fields for Principal and HOD names, messages, and profile photos.
- **Content Moderation & Review Board**: Built-in review workflows to eliminate horizontal scrolling issues and streamline the approval process.

## 🛠️ Technology Stack

### Frontend
- **React 18** with **TypeScript**
- **Framer Motion** for smooth animations and transitions
- **Lucide React** for modern iconography
- **React Router** for routing
- **Axios** for API requests
- **React Dropzone** for drag-and-drop file/photo uploads

### Backend
- **Node.js** & **Express**
- **Puppeteer** for automated, high-fidelity PDF generation
- **Multer** for handling file and image uploads
- **PostgreSQL / MongoDB** (Supports both Sequelize and Mongoose ORMs)
- **JWT & Bcrypt** for secure authentication and authorization

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:
- **Node.js** (v18 or higher recommended)
- **NPM** (Node Package Manager)

## ⚙️ Installation & Setup

This project consists of a React Frontend and a Node.js Backend. Follow these steps to get everything running locally.

### 1. Start the Backend (API)
Open a terminal and run:
```bash
cd backend
npm install
npm start
```
*The server will start on [http://localhost:5000](http://localhost:5000).*  
*Note: It will run in **Demo Mode** (PostgreSQL/MongoDB connection warnings are normal if you don't have them running locally).*

### 2. Start the Frontend (UI)
Open a **second** terminal and run:
```bash
cd frontend
npm install
npm start
```
*The application should automatically open in your browser at [http://localhost:3000](http://localhost:3000).*

## 🔑 Demo Credentials

On the login screen, click the **"⚡ Fill demo credentials"** button to automatically log in as a **Student** with the following credentials:
- **Email:** `student@fcrit.ac.in`
- **Password:** `demo123`

*(Additional demo credentials for Faculty and Lab Assistant roles may be provided in the UI or seed data).*

## 📁 Project Structure

```
.
├── backend/                # Node.js + Express API source code
│   ├── src/                # Backend source files (controllers, routes, services)
│   ├── package.json        # Backend dependencies
│   └── ...
├── frontend/               # React + TypeScript source code
│   ├── src/                # Frontend source files (components, pages, styles)
│   ├── package.json        # Frontend dependencies
│   └── ...
├── RUN_INSTRUCTIONS.md     # Quick start guide
└── README.md               # Project documentation
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

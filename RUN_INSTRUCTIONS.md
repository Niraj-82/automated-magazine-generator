# Tech Odyssey Magazine — Run Instructions

This project consists of a **React Frontend** and a **Node.js Backend**. Follow these steps to get everything running locally.

## 1. Prerequisites
- **Node.js** (v18+ recommended)
- **NPM**

## 2. Start the Backend (API)
Open a terminal and run:
```bash
cd backend
npm start
```
*The server will start on [http://localhost:5000](http://localhost:5000).*
*Note: It will run in **Demo Mode** (PostgreSQL/MongoDB connection warnings are normal if you don't have them running locally).*

## 3. Start the Frontend (UI)
Open a **second** terminal and run:
```bash
cd frontend
npm start
```
*The application should automatically open in your browser at [http://localhost:3000](http://localhost:3000).*

---

## 🔑 Demo Credentials
On the login screen, click the **"⚡ Fill demo credentials"** button to automatically log in as a **Student** with:
- **Email:** `student@fcrit.ac.in`
- **Password:** `demo123`

## 📁 Project Structure
- `/frontend`: React + TypeScript source code.
- `/backend`: Node.js + Express API source code.

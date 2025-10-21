# 🧭 Task Manager (Full Stack Assessment Project)

A full-stack **Task Management Application** built using **Node.js, Express, MongoDB**, and **HTML/CSS/JavaScript** (no frameworks).  
This project provides **task CRUD**, **audit logs**, and **user authentication** with a clean professional UI.

---

## 🚀 Features

### 🌐 Frontend
- Responsive layout using pure **HTML, CSS, and JS**
- Side navigation with sections for **Tasks** and **Logs**
- Modern main frame UI
- **Settings drop-up** for Sign In / Sign Up / Sign Out
- Dynamic user display beside “Tasks”
- Pagination for both Tasks and Audit Logs
- Real-time task updates without reload

### ⚙️ Backend
- RESTful API using **Node.js + Express**
- **MongoDB** with Mongoose ODM
- **User authentication** (JWT-based)
- Task management (CRUD operations)
- Audit log tracking for every create, update, and delete
- Built-in **pagination and search**

---

## 🧩 Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | HTML5, CSS3, JavaScript (ES6) |
| Backend | Node.js, Express.js |
| Database | MongoDB (via Mongoose) |
| Authentication | JSON Web Token (JWT) |
| Environment | dotenv |
| Logging | Custom MongoDB Audit Log model |

---

---

## ⚙️ Installation

### 1️⃣ Prerequisites
Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or later)
- [MongoDB Compass](https://www.mongodb.com/products/compass) or MongoDB Atlas
- Git

---

### 2️⃣ Clone the Repository
```bash
git clone https://github.com/<PremPraneethKumar>/Task-Management-Dashboard.git
cd Task Manager Dashboard
```
3️⃣ Install Backend Dependencies
```bash
cd backend
npm install
```
4️⃣ Setup Environment Variables

Create a .env file inside /backend with the following content:
```bash
PORT=5000
MONGO_URI= "your mongodb url"
JWT_SECRET=supersecretkey
```
5️⃣ Start the Server
```bash
node server.js
```

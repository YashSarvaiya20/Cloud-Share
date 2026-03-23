# ☁️ Cloud Share App

🚀 A full-stack file sharing platform with secure uploads, file management, and Razorpay payment integration.

---

## 🔥 Live Features

* 📁 Upload & manage files
* 📊 Dashboard with recent files
* 🔒 Secure backend with Spring Boot
* 💳 Razorpay payment integration
* ☁️ MongoDB database
* 🎯 Clean UI (React + Tailwind)

---

## 🛠️ Tech Stack

### 🎨 Frontend

* React.js
* Tailwind CSS
* Axios

### ⚙️ Backend

* Spring Boot
* Spring Data MongoDB
* REST APIs

### 🗄️ Database

* MongoDB (Local / Atlas)

### 💳 Payment

* Razorpay

---

## 📂 Project Structure

```
Cloud-Share/
 ├── frontend/   # React App
 ├── backend/    # Spring Boot App
 └── README.md
```

---

## ⚙️ Setup Guide

### 1️⃣ Clone Project

```
git clone https://github.com/your-username/Cloud-Share.git
cd Cloud-Share
```

---

### 2️⃣ Backend Setup

```
cd backend
```

Update `application.properties`:

```
spring.data.mongodb.uri=${MONGO_URI}
```

Run backend:

```
mvn spring-boot:run
```

---

### 3️⃣ Frontend Setup

```
cd frontend
npm install
npm start
```

---

## 🔐 Environment Variables

Create `.env` file:

```
MONGO_URI=your_mongodb_connection
RAZORPAY_KEY=your_key
RAZORPAY_SECRET=your_secret
```

---

## 💳 Razorpay Integration

* Secure payment gateway
* Test & Live modes supported
* Payment verification handled in backend

---


## 🧑‍💻 Author

* Yash Sarvaiya

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

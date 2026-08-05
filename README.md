# 🚀 Automated Intern Offer Letter Generation & Mailing System

A full-stack HR automation platform that enables HR/Admin users to generate professional internship offer letters as PDFs and automatically send them to candidates via email in a single click.

---

## 📌 Overview

The **Automated Intern Offer Letter Generation & Mailing System** eliminates repetitive HR tasks by automating:

- Offer Letter Generation
- PDF Creation
- Email Delivery
- Offer Record Management

Instead of manually editing Word documents and sending emails individually, HR simply enters candidate details through a web interface, and the system handles the rest.

---

## ✨ Features

### 🔐 Authentication
- HR/Admin Login
- JWT Authentication
- Protected Routes
- Password Encryption (bcrypt)

### 📝 Offer Letter Generation
- Candidate Information Form
- Dynamic HTML Template
- Professional PDF Generation
- Company Branding Support

### 📧 Email Automation
- Automatic Email Dispatch
- PDF Attachment
- Email Status Tracking
- Retry Failed Emails

### 📂 Offer Management Dashboard
- View All Generated Offers
- Search & Filter Records
- Download Offer Letter
- Resend Email

---

# 🏗 System Workflow

```
HR Login
      │
      ▼
Fill Candidate Details
      │
      ▼
Generate Offer Letter
      │
      ▼
Generate PDF
      │
      ▼
Save Record in Database
      │
      ▼
Send Email Automatically
      │
      ▼
Update Status
      │
      ▼
Dashboard
```

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- React Hook Form
- Yup / Zod

---

## Backend

- Node.js
- Express.js
- JWT
- bcrypt

---

## Database

- MongoDB
- Mongoose

---

## PDF Generation

- Puppeteer

---

## Email Service

- Nodemailer
- Gmail SMTP / SendGrid / Amazon SES

---

## Deployment

- Render
- Vercel

---

# 📂 Project Structure

```
offer-letter-automation/

│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── templates/
│   ├── utils/
│   └── server.js
│
├── .env.example
└── README.md
```

---

# 📋 Candidate Form Fields

- Candidate Name
- Candidate Email
- Position / Designation
- Department
- Date of Joining
- Internship Duration
- Stipend / Salary
- Reporting Manager
- Offer Issue Date

---

# 🗄 Database Schema

## User

```javascript
{
  name,
  email,
  password,
  role,
  createdAt
}
```

### Offer

```javascript
{
  candidateName,
  candidateEmail,
  designation,
  department,
  dateOfJoining,
  stipendOrCTC,
  reportingManager,
  offerIssueDate,
  pdfUrl,
  emailStatus,
  generatedBy,
  createdAt
}
```

---

# 🔒 Security

- JWT Authentication
- Password Hashing (bcrypt)
- Protected API Routes
- Input Validation
- Sanitization
- Environment Variables

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/offer-letter-automation.git
```

```
cd offer-letter-automation
```

---

## Backend

```bash
cd server
npm install
```

Create `.env`

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

EMAIL_USER=

EMAIL_PASS=
```

Run Server

```bash
npm run dev
```

---

## Frontend

```bash
cd client

npm install

npm run dev
```

---

# 📬 API Endpoints

## Authentication

```
POST /api/auth/login
POST /api/auth/register
```

---

## Offer Letter

```
POST /api/offers/generate

GET /api/offers

GET /api/offers/:id

POST /api/offers/resend/:id

GET /api/offers/download/:id
```

---

# 🎯 Future Enhancements

- Digital Signature Support
- Candidate Acceptance Portal
- WhatsApp Notifications
- SMS Integration
- Multi-template Support
- HRMS Integration
- Approval Workflow
- Email Queue (BullMQ + Redis)

---

# 📸 Screenshots

```
Coming Soon...
```

---

# 👨‍💻 Developed By

**Full Stack Internship Project**

Designed for HR Process Automation

---

# 📄 License

This project is licensed under the MIT License.

---

# ⭐ Support

If you found this project useful,

⭐ Star the repository

🍴 Fork it

📢 Share it

---

## 📞 Contact

For questions or contributions, feel free to create an Issue or Pull Request.

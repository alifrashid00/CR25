# Student Marketplace

A full-stack web application for university students to buy, sell, and trade items, bid on products, and offer services within their campus community.

## Features

### For Students
- **Buy and Sell Items**: Post items for sale with images and descriptions, set fixed prices or enable bidding, negotiate prices through chat, and track item views and interested buyers.
- **Real-time Chat**: Direct messaging between buyers and sellers, image sharing, location sharing for meetups, and meeting point coordination.
- **Location Services**: Share and agree on meeting locations, view meeting points on OpenStreetMap, and ensure safe transaction locations.
- **Bidding System**: Place bids on items, real-time bid updates, bid history tracking, and automatic highest bid tracking.
- **Reviews and Ratings**: Rate sellers after transactions, leave detailed reviews, and view seller ratings and history.
- **AI-Powered Features**: Expert analysis of items, price estimation for listings, and chatbot assistance.

### For Administrators
- **User Management**: View and manage student profiles, suspend/activate accounts, and monitor user activity.

## Technology Stack

- **Frontend**: React.js (with Vite), Context API for state management, real-time updates with Firebase
- **Backend**: Firebase Authentication, Cloud Firestore, Firebase Storage
- **AI Integration**: GROQ API for expert analysis, machine learning for price estimation

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone [repository-url]
   cd student-marketplace
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Update the `.env` file with your configuration:
     ```env
     # Firebase Configuration
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
     
     # GROQ API Configuration (for AI chatbot)
     VITE_GROQ_API_KEY=your_groq_api_key
     
     # University Email Domains (comma-separated)
     VITE_UNIVERSITY_DOMAINS=your-university.edu,another-university.edu
     ```

4. **Set up Firebase:**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase configuration values to the `.env` file

5. **Set up GROQ API (Optional - for AI features):**
   - Get an API key from [GROQ](https://console.groq.com/)
   - Add it to your `.env` file as `VITE_GROQ_API_KEY`
6. **Start the development server:**
   ```bash
   npm run dev
   ```

## Security Notes

- **Never commit your `.env` file** to version control. It contains sensitive API keys.
- The `.env` file is already included in `.gitignore` to prevent accidental commits.
- Use `.env.example` as a template for setting up environment variables.
- Keep your Firebase and GROQ API keys secure and rotate them regularly.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── modal/          # Modal components for chat and analysis
├── pages/          # Page components and routes
├── services/       # API and service functions
└── assets/         # Static assets and images
```

## Authentication and Authorization
- Email/password authentication
- Role-based access control (Student/Admin)
- Protected routes for authenticated users
- Secure file uploads and storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For questions or support, please reach out to the development team.

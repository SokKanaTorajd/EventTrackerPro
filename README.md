# Event Participant Management System

This application streamlines event participant management by providing registration forms, conducting background checks, and automating approvals for returning attendees.

## Features

- **Dashboard**: View statistics about events and participants
- **Event Management**: Create and manage events with customizable registration forms
- **Participant Management**: Review and manage participant applications
- **Background Checks**: Track status of background checks for participants
- **Automated Approvals**: Automatically approve returning participants
- **Email Templates**: Customize and manage email templates for various notifications

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Application

To start the application in development mode:

```bash
npm run dev
```

This will:
- Start the Express.js backend server
- Launch the React frontend with Vite
- The application will be available at http://localhost:5000

### Login Credentials

Default admin account:
- Username: `admin`
- Password: `password`

## Usage Guide

### Creating an Event

1. Log in to the application
2. Navigate to "Events" in the sidebar
3. Click "Create Event" button
4. Fill in the event details (name, description, dates, etc.)
5. Customize the registration form by:
   - Adding custom fields
   - Removing unwanted fields
   - Reordering fields
   - Setting required fields
6. Set the event status to "Active" when ready to accept registrations
7. Click "Create Event" to save

### Managing Participants

1. Navigate to "Participants" in the sidebar
2. Review pending applications
3. Approve or reject participants
4. View background check status

### Email Templates

1. Navigate to "Email Templates" in the sidebar
2. Create or edit templates for:
   - Welcome emails
   - Approval notifications
   - Rejection notifications
   - Reminder emails

## Technology Stack

- **Frontend**: React, TailwindCSS, shadcn/ui, React Query
- **Backend**: Express.js
- **Storage**: In-memory storage (development mode)
# Retro Board Application

A collaborative retro board application designed to facilitate team retrospectives and agile ceremonies. Built with Next.js, React, and Tailwind CSS, this application allows teams to create boards with columns and cards to track feedback, ideas, and tasks.

## 📋 Project Overview

The Retro Board Application helps teams conduct effective retrospectives by providing a visual, intuitive interface for organizing feedback. It supports real-time collaboration, voting, and commenting to prioritize important items and drive continuous improvement.

## ✨ Key Features

### Authentication
- **Login System**: Secure user authentication with username and password
- **Session Management**: Persistent sessions for seamless user experience

### Dashboard
- **Board Overview**: List of active boards with details (members, columns, cards)
- **Recent Boards**: Quick access to recently viewed boards
- **Responsive Navigation**: Collapsible sidebar with intuitive menu structure

### Board Management
- **Create Boards**: Start new retrospectives with custom or template-based boards
- **Board Settings**: Configure board details and permissions
- **Column Management**: Add, edit, delete, and reorder columns

### Card Operations
- **Add Cards**: Create cards with titles and detailed content
- **Edit Cards**: Modify card details with markdown support
- **Delete Cards**: Remove unwanted cards with confirmation
- **Drag-and-Drop**: Intuitive card reordering and column switching

### Collaboration
- **Voting System**: Upvote cards to prioritize important feedback
- **Comments**: Add context and discussions to cards
- **Notifications**: Alerts for mentions and new comments

### Permissions
- **Role-Based Access**: Board Owner, Member, and Viewer roles
- **Invitation System**: Invite team members with specific permissions

### Responsive Design
- **Desktop**: Full-featured three-column layout
- **Tablet**: Optimized two-column layout
- **Mobile**: Touch-friendly single-column layout

## 🛠️ Technical Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Material-UI
- **Markdown Support**: React Markdown
- **Form Handling**: Formik + Yup
- **HTTP Client**: Axios
- **Testing**: Jest + React Testing Library

## 📦 Installation

### Prerequisites
- Node.js 16+
- npm or Yarn package manager

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd funny-coworkers/retro-board/front-end
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add any required environment variables:
   ```env
   # Example environment variables
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## 🚀 Usage

### Development Mode

Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Mode

Build the application for production:
```bash
npm run build
# or
yarn build
```

Start the production server:
```bash
npm start
# or
yarn start
```

## 📁 Project Structure

```
app/
├── components/           # Reusable React components
│   ├── auth/            # Authentication-related components
│   ├── board/           # Board and column components
│   ├── card/            # Card-related components
│   ├── layout/          # Layout components (header, sidebar)
│   └── common/          # Common UI components
├── board/[id]/          # Dynamic board pages
├── dashboard/           # Dashboard page
├── styles/              # Global styles and Tailwind config
├── layout.tsx           # Root layout component
└── page.tsx             # Login page
```

## 📜 Available Scripts

| Script        | Description                               |
|---------------|-------------------------------------------|
| `npm run dev` | Start development server                  |
| `npm run build`| Build application for production          |
| `npm start`   | Start production server                   |
| `npm run lint`| Run ESLint for code quality checks        |
| `npm test`    | Run Jest tests                            |

## 🎯 Usage Examples

### 1. Creating a New Board
1. Log in to the application
2. Click "Create New Board" on the dashboard
3. Enter board name and description
4. Select a template or create a custom board
5. Click "Create Board" to start collaborating

### 2. Adding Cards
1. Open a board
2. Click "Add Card" in any column
3. Enter card title and content
4. Click "Add Card" to save

### 3. Voting on Cards
1. Open a board
2. Click the upvote button on any card
3. Watch the vote count update in real-time

### 4. Inviting Team Members
1. Open a board
2. Click "Team Members" in the board header
3. Enter email addresses of team members
4. Select roles for each invitee
5. Click "Invite" to send invitations

## 📄 Product Requirement Specification

This project is based on the Product Requirement Specification (PRS) located at `PRS.md`. The PRS details the complete set of requirements, features, and technical specifications for the application.

## 👥 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 📞 Support

For questions or issues, please contact the development team or open an issue in the repository.

---

**Happy Retrospecting!** 🎉
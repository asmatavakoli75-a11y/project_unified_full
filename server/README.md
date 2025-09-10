# Backend Server

This is the backend server for the CLBP Predictive System. It uses Node.js, Express, and Sequelize to connect to a MySQL database.

## Prerequisites

- Node.js
- npm
- MySQL Server

## Setup

1.  **Navigate to the server directory:**
    ```sh
    cd server
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Create Environment File:**
    Create a `.env` file in the `server` directory. You can do this by copying the example file:
    ```sh
    cp .env.example .env
    ```
4.  **Configure Environment Variables:**
    Open the newly created `.env` file and update the `DB_` variables to match your local MySQL server configuration.
    ```
    # Server Configuration
    PORT=5000
    JWT_SECRET=your_jwt_secret

    # Database Configuration - MySQL
    DB_HOST=127.0.0.1
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    DB_PORT=3306
    DB_DIALECT=mysql
    ```

## Running the server

To start the server with automatic restarts on file changes, run the following command from the `server` directory:
```sh
npm start
```

Alternatively, to run both the frontend and backend concurrently from the project's root directory, use:
```sh
npm run dev
```

# Backend Server

This is the backend server for the CLBP Predictive System. It uses Node.js, Express, and Sequelize to connect to a MySQL database.

## Prerequisites

- Node.js
- npm
- A running MySQL Server instance

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
    Create a `.env` file in this `server` directory. You can copy the example file to get started:
    ```sh
    cp .env.example .env
    ```
4.  **Configure Environment Variables:**
    Open the newly created `.env` file and update the `DB_` variables to match your local MySQL server configuration. The server port is also configured here.
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

To start the backend server, run the following command from the `server` directory:
```sh
npm start
```
The server will listen on the port defined in your `.env` file (default is 5000).

To run the entire application (frontend and backend), navigate to the **root directory** of the project and run:
```sh
npm run dev
```
This will start the frontend on port 4028 and the backend on port 5000.

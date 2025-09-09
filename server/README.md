# Backend Server

This is the backend server for the CLBP Predictive System.

## Prerequisites

- Node.js
- npm
- MySQL

## Setup

1.  Navigate to the `server` directory:
    ```sh
    cd server
    ```
2.  Install the dependencies:
    ```sh
    npm install
    ```
3.  This project uses a MySQL database. To configure the connection, create a `.env` file in the `server` directory. You can use the `.env.example` file as a template:
    ```sh
    cp .env.example .env
    ```
4.  Update the `.env` file with your MySQL database credentials.

## Running the server

To start the server, run the following command from the `server` directory:

```sh
npm start
```

This will start the server with `nodemon`, which will automatically restart the server when you make changes to the code.

Alternatively, you can run both the frontend and backend concurrently from the root directory of the project:

```sh
npm run dev
```

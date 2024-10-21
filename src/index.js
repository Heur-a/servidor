/*
 * @Author: Alex Escrivà Caravaca 
 * @Date: 2024-10-09 10:23:28 
 * @Last Modified by: Alex Escrivà Caravaca
 * @Last Modified time: 2024-10-21 18:03:05
 */
/**
 * @file index
 * @brief Entry point of the API application that initializes the Express server, sets up routes, and serves API documentation.
 * @requires express
 * @requires path
 * @requires fileURLToPath
 * @requires medicionesRoutes
 * @requires swaggerUi
 * @requires YAML
 * @requires config
 * @description This file configures and starts the Express server, connects to the database, sets up middleware, and loads API documentation using Swagger UI.
 * 
 * 
 * This file configures and starts the Express server, connects to the database, sets up middleware, and loads API documentation using Swagger UI.
 * It defines the main route and handles requests to other routes through dedicated route modules.
 * 
 * @author Alex Escrivà Caravaca
 * @date 2024-10-06
 * @version 1.0.0
 * @last_modified 2024-10-09
 */

import express from 'express';
import path from 'path';  // To resolve file paths
import { fileURLToPath } from 'url';  // To work with ES modules
import medicionesRoutes from './routes/medicionesRoutes.js';  // Route handling for measurement endpoints
import swaggerUi from 'swagger-ui-express';  // Swagger UI for API documentation
import YAML from 'yamljs';  // To load the API documentation from a YAML file
import { config } from 'dotenv';  // To load environment variables from a .env file
import fetch from 'node-fetch';  // To perform HTTP requests
import https from 'https';

// Initialize the Express app
const app = express();

// Load Swagger API documentation from YAML file
const swaggerDocument = YAML.load('./doc/api/api.yaml');

// Load environment variables from .env file
config();

// URL to fetch the latest measurement
const url = 'http://localhost/mediciones/ultima';

// Middleware for parsing JSON requests
app.use(express.json());

// Get the current directory (ES modules replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Configure https server
const httpsServer = https.createServer({
    key: fs.readFileSync('./certs/fake-key.pem'),
    cert: fs.readFileSync('./certs/fake-cert.pem')
}, app);

/**
 * @brief Serves the Swagger API documentation.
 * 
 * This middleware serves the API documentation generated from the `api.yaml` file in the `/api-docs` path.
 * It provides an interactive interface for testing the API's endpoints.
 * 
 * @route /api-docs
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * @brief Sets up the routes for measurement (mediciones) endpoints.
 * 
 * This middleware uses the `medicionesRoutes` module to handle all requests to `/mediciones`.
 * The actual logic for these routes is managed in the corresponding controller.
 * 
 * @route /mediciones
 */
app.use('/mediciones', medicionesRoutes);

/**
 * @brief Serves up the routes for users endpoints.
 * 
 * This middleware uses the `usersRoutes` module to handle all requests to `/users`.
 * The actual logic for these routes is managed in the corresponding controller.
 * 
 * @route /users
 * @see usersRoutes
 */
app.use('/users', usersRoutes);


/**
 * @brief Main route for the web server.
 * 
 * The root route `/` sends a message confirming the server's status.
 * It also makes a request to the `/mediciones/ultima` endpoint to fetch the latest measurement.
 * 
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * 
 * @route /
 */

//todo: Hacer la ruta principal un servidor web con https y  que ponga una pagina html



app.get('/', (req, res) => {
    // Fetch the latest measurement from the /mediciones/ultima endpoint
    fetch(url)
        .then(resGet => resGet.json())  // Convert the response to JSON
        .then(data => {
            console.log(data);  // Log the fetched data
            res.send('Web server and REST API running! Latest measurement: ' + JSON.stringify(data));  // Send a response including the fetched data
        })
        .catch(error => {
            console.error('Error: ', error);  // Log any errors
            res.send('Something went wrong, danger!');  // Send an error message if the request fails
        });
});



/**
 * @brief Starts the Express server and listens on a specific port.
 * 
 * The server listens on the port specified in the environment variables (`PORT`) or defaults to port 3000.
 * When the server starts, it logs the MySQL database connection details from the environment variables.
 */

export default app;  // Export the Express app for testing purposes

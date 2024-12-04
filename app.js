const express = require('express');
const cors = require('cors');
const router = require('./routes'); // Ensure you have the `routes` module properly defined
const bodyParser = require('body-parser');

const app = express();
const port = 4000;

// Enable CORS for all origins
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());
app.use(bodyParser.json());

// Use the router for handling routes
app.use(router);

// Start the server and bind to 0.0.0.0 for external access
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
  console.log(`Access it via your IP: http://<your-server-ip>:${port}`);
});

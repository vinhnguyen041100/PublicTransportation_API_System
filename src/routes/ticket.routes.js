const Router = require("express").Router();
const roleValidation = require("../validations/role.validation");
const ticketController = require("../controllers/ticket.controllers")

// Get all ticket
Router.get('/', roleValidation.staff, ticketController.get);

// Create ticket
Router.post('/create', roleValidation.admin, ticketController.create);

module.exports = Router;
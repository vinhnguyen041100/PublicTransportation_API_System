// Route Controller: Get - Create - Update - Delete

const RouteModel = require("../models/Route.model");
const VehicleModel = require("../models/Vehicle.model");
const removeUnvalidVehicleId = require("../utils/removeUnvalidVehicleId");

// Get route
exports.get = async (req, res, next) => {
    try {
        const routes = await RouteModel.find({}).populate("vehicles").lean().exec();
        
        if (!routes || routes.length < 1) {
            return res.json({
                success: true,
                message: "No route found!"
            })
        }

        return res.json({
            success: true,
            message: "Routes found!",
            total_route: routes.length,
            routes: routes
        })
    } catch (e) {
        console.log("ERR: Register Error: ", e);
        next(e);
    }
}

// Get route by id
exports.getById = async (req, res, next) => {
    const { routeId } = req.params

    try {
        const route = await RouteModel.findOne({ _id: routeId }).populate("vehicles").lean().exec();

        if (!route || route.length < 1) {
            return res.json({
                success: true,
                message: "No route found!"
            })
        }

        return res.json({
            success: true,
            message: "Routes found!",
            route: route
        })

    } catch (e) {
        console.log("ERR: Register Error: ", e);
        next(e);
    }
}

// Create route
exports.create = async (req, res, next) => {
    const { route_name, distance_length, time_start, time_end, stations, vehicles } = req.body;

    try {
        // Handling when stations and vehicles empty list
        if (stations.length < 1 || vehicles.length < 1 || time_start.length < 1 || time_end.length < 1) {
            return res.json({
                success: false,
                message: "Field can not be empty"
            })
        }
        
        // If Vehicle ID is invalid, this function will return undefined in Vehicle List then remove undefined from it list.
        const vehicleId = removeUnvalidVehicleId(vehicles)

        const vehicleExist = await VehicleModel.find({ _id: vehicleId }).lean().exec()

        const vehicleFilter = vehicleExist.filter(vehicle => { 
            return vehicle.vehicle_available === false;
         });

        if (!vehicleFilter || vehicleFilter.length > 0) {
            return res.json({
                success: true,
                message: "Vehicle currently unavailable",
                vehicles: vehicleFilter
            });
        }

        await VehicleModel.updateMany(
            { _id: vehicleId }, 
            {"vehicle_available": false,},
            { new: true })
            .exec();

        if (vehicles.length - vehicleExist.length > 0) {
            return res.json({
                success: false,
                message: "Vehicles list have invalid Vehicle ID"
            })
        }

        const newRoute = await RouteModel.create({
            route_name: route_name,
            distance_length: distance_length,
            route_price: distance_length < 15 ? 5000 : distance_length < 25 ? 6000 : 7000,
            time_start: time_start,
            time_end: time_end,
            stations: stations,
            vehicles: vehicles
        })

        return res.json({
            success: true,
            message: "RouteController: Create Route Success!",
            route: newRoute,
        })
    } catch (e) {
        console.log("ERR: Register Error: ", e);
        next(e);
    }
}

// delete route
exports.delete = async (req, res, next) => {
    const { routeId } = req.params;

    try {
        const routes = await RouteModel.find({ _id: routeId }).lean().exec();
        
        if (!routes || routes.length < 1) {
            return res.json({
                success: true,
                message: "Route not existed!"
            });
        };

        routes.forEach(async (x) => {
            await VehicleModel.updateMany(
                { _id: x.vehicles }, 
                {"vehicle_available": true,},
                { new: true })
            .exec();
        });

        await RouteModel.findByIdAndDelete({ _id: routeId }).lean().exec();

        return res.json({
            success: true,
            message: `Route ${routeId} deleted!`
        });
        
    } catch (e) {
        console.log("ERR: Register Error: ", e);
        next(e);
    }
}
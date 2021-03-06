var express = require("express");
var bodyParser = require("body-parser");
var _ = require("underscore");

module.exports = function(port, middleware, callback) {
    var app = express();

    if (middleware) {
        app.use(middleware);
    }
    app.use(express.static("public"));
    app.use("/fetch/", express.static("node_modules/whatwg-fetch"));
    app.use(bodyParser.json());

    var latestId = 0;
    var todos = [];

    // Create
    app.post("/api/todo", function(req, res) {
        var todo = req.body;
        todo.id = latestId.toString();
        latestId++;
        todos.push(todo);
        res.set("Location", "/api/todo/" + todo.id);
        res.sendStatus(201);
    });

    // Update
    app.put("/api/todo/:id", function(req, res) {
        var todo = getTodo(req.params.id);
        if (todo) {
            if (req.body.title !== undefined) {
                todo.title = req.body.title;
            }
            else {
                todo.title = todo.title;
            }
            if (req.body.isComplete) {
                todo.isComplete = true;
            }
            else {
                todo.isComplete = false;
            }
            res.sendStatus(200);
        }
        else {
            var todoIn = req.body;
            todoIn.id = req.params.id;
            if (req.body.title !== undefined) {
                todoIn.title = req.body.title;
                if (req.body.isComplete === true) {
                    todoIn.isComplete = true;
                }
                else {
                    todoIn.isComplete = false;
                }
                todos.push(todoIn);
                res.sendStatus(201);
            }
            else {
                res.sendStatus(500);
            }
        }

    });

    // Read
    app.get("/api/todo", function(req, res) {
        res.json(todos);
    });

    // Delete
    app.delete("/api/todo/:id", function(req, res) {
        var id = req.params.id;
        var todo = getTodo(id);
        if (todo) {
            todos = todos.filter(function(otherTodo) {
                return otherTodo !== todo;
            });
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    });

    function getTodo(id) {
        return _.find(todos, function(todo) {
            return todo.id === id;
        });
    }

    var server = app.listen(port, callback);

    // We manually manage the connections to ensure that they're closed when calling close().
    var connections = [];
    server.on("connection", function(connection) {
        connections.push(connection);
    });

    return {
        close: function(callback) {
            connections.forEach(function(connection) {
                connection.destroy();
            });
            server.close(callback);
        }
    };
};

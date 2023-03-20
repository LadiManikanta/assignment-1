const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(1432, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category
  );
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.category
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const addDays = require("date-fns/addDays");
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  todo LIKE '%${search_q}%' AND 
              status = '%${status}%' AND priority = '%${priority}%';
          `;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  todo LIKE '%${search_q}%' AND 
              status = '${status}' AND category = '${category}';
          `;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  todo LIKE '%${search_q}%' AND 
              priority = '${priority}' AND category = '${category}';
          `;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE   todo LIKE '%${search_q}%' AND
              priority = '${priority}';
          `;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE todo LIKE '%${search_q}%' AND 
              status = '${status}';
          `;
      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  todo LIKE '%${search_q}%' AND
              category = '${category}';
          `;
      break;

    default:
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  
              todo LIKE '%${search_q}%';
          `;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});
module.exports = app;

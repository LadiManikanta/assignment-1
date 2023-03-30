const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const dateCon = require("date-fns/addDays");
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(1815, () => {
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
const convertToResponseObject = (hell) => {
  return {
    id: hell.id,
    todo: hell.todo,
    priority: hell.priority,
    status: hell.status,
    category: hell.category,
    dueDate: hell.due_date,
  };
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
      data = await db.all(getTodosQuery);
      response.send(data.map((hell) => convertToResponseObject(hell)));
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  todo LIKE '%${search_q}%' AND 
              status = '${status}' AND category = '${category}';
          `;
      data = await db.all(getTodosQuery);
      response.send(data.map((hell) => convertToResponseObject(hell)));
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  todo LIKE '%${search_q}%' AND 
              priority = '${priority}' AND category = '${category}';
          `;
      data = await db.all(getTodosQuery);
      response.send(data.map((hell) => convertToResponseObject(hell)));
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE   todo LIKE '%${search_q}%' AND
              priority = '${priority}';
          `;
      data = await db.all(getTodosQuery);
      if (data === undefined) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.send(data.map((hell) => convertToResponseObject(hell)));
      }

      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE todo LIKE '%${search_q}%' AND 
              status = '${status}';
          `;
      data = await db.all(getTodosQuery);
      if (data === undefined) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.send(data.map((hell) => convertToResponseObject(hell)));
      }

      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  todo LIKE '%${search_q}%' AND
              category = '${category}';
          `;
      data = await db.all(getTodosQuery);
      if (data === undefined) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        response.send(data.map((hell) => convertToResponseObject(hell)));
      }

      break;

    default:
      getTodosQuery = `
            SELECT *
            FROM todo 
            WHERE  
              todo LIKE '%${search_q}%';
          `;
      data = await db.all(getTodosQuery);
      response.send(data.map((hell) => convertToResponseObject(hell)));
      break;
  }
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  getQuery = `
    SELECT *
    FROM todo
    WHERE 
      id = '${todoId}';
  `;
  const data = await db.get(getQuery);
  response.send(convertToResponseObject(data));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(typeof date);
  const conDate = new Date(date);
  const year = conDate.getFullYear();
  const month = conDate.getMonth();
  const dayDate = conDate.getDate();
  console.log(conDate);
  console.log(year);
  console.log(month);
  console.log(dayDate);
  getQuery = `
    SELECT *
    FROM todo
    WHERE 
      CAST(strftime("%Y",due_date) AS INTEGER) = ${year} AND 
      CAST(strftime("%m",due_date) AS INTEGER) = ${month} AND 
      CAST(strftime("%d",due_date) AS INTEGER) = ${dayDate};
    
 
  `;
  const data = await db.all(getQuery);
  response.send(data.map((hell) => convertToResponseObject(hell)));
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const dateFns = new Date(dueDate);

  const queryDetails = `
    INSERT INTO 
      todo(id,todo,category,priority,status, due_date)
    VALUES(${id}, '${todo}', '${category}', '${priority}', '${status}', '${dateFns}');
  `;

  await db.run(queryDetails);

  response.send("Todo Successfully Added");
});

const forStatus = (All) => {
  return All.status !== undefined;
};
const forPriority = (All) => {
  return All.priority !== undefined;
};
const forCategory = (All) => {
  return All.category !== undefined;
};
const forTodo = (All) => {
  return All.todo !== undefined;
};
const forDate = (All) => {
  return All.dueDate !== undefined;
};

app.put("/todos/:todoId/", async (request, response) => {
  let queryDetails = "";
  let { todoId } = request.params;
  let updateVar = "";

  switch (true) {
    case forStatus(request.body):
      const status = request.body;
      const value = status.status;
      if (value === "TO DO" || value === "IN PROGRESS" || value === "DONE") {
        queryDetails = `
          UPDATE todo
          SET status = '${value}'
          WHERE id = ${todoId};
      `;
        updateVar = "Status";
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case forPriority(request.body):
      const priority = request.body;
      const value = priority.priority;
      if (value === "HIGH" || value === "MEDIUM" || value === "LOW") {
        queryDetails = `
        UPDATE todo
        SET priority = '${value}'
        WHERE id = ${todoId};
      `;
        updateVar = "Priority";
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    case forCategory(request.body):
      const category = request.body;
      const value = category.category;
      if (value === "WORK" || value === "HOME" || value === "LEARNING") {
        queryDetails = `
        UPDATE todo
        SET priority = '${value}'
        WHERE id = ${todoId};
      `;
        updateVar = "Category";
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;

    case forTodo(request.body):
      const { todo } = request.body;
      queryDetails = `
        UPDATE todo
        SET todo = '${todo}'
        WHERE id = ${todoId};
      `;
      updateVar = "Todo";
      break;
    case forDate(request.body):
      const { dueDate } = request.body;
      const conDate = new Date(dueDate);
      const year = conDate.getFullYear();
      const month = conDate.getMonth();
      const dayDate = conDate.getDate();
      queryDetails = `
        UPDATE todo
        SET 
          due_date = '${dueDate}'
        WHERE id = ${todoId};
      `;
      updateVar = "Date";
      break;

    default:
      queryDetails = `
          UPDATE todo
          SET id = ${todoId}
          WHERE id = ${todoId}

        `;
      updateVar = "Wrong";
      break;
  }
  await db.run(queryDetails);
  response.send(`${updateVar} Updated`);
});
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const queryDetails = `
      DELETE FROM
        todo
      WHERE id = ${todoId};
    
    `;

  await db.run(queryDetails);
  response.send("Todo Deleted");
});

module.exports = app;

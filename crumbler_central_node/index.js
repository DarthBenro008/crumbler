console.log("welcome to crumbler node");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: "*",
  allowEIO3: true,
});

let cloudNumeracy = [];
let countHitter = 0;
let goal = 0;

function intersection() {
  var result = [];
  var lists;

  if (arguments.length === 1) {
    lists = arguments[0];
  } else {
    lists = arguments;
  }

  for (var i = 0; i < lists.length; i++) {
    var currentList = lists[i];
    for (var y = 0; y < currentList.length; y++) {
      var currentValue = currentList[y];
      if (result.indexOf(currentValue) === -1) {
        if (
          lists.filter(function (obj) {
            return obj.indexOf(currentValue) == -1;
          }).length == 0
        ) {
          result.push(currentValue);
        }
      }
    }
  }
  return result;
}

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.join("worker_room");
  socket.on("incoming_result", (data) => {
    const filteredArray = cloudNumeracy.filter((value) => {
      return !data.includes(value);
    });
    cloudNumeracy = filteredArray;
    countHitter += 1;
    if (countHitter === goal) {
      console.log("Primes are: ", cloudNumeracy.length);
    }
  });
});

app.use(express.json());
const sieve = (range) => {
  const rootNumber = Math.floor(Math.sqrt(range));
  let numberArray = Array.from(Array(range).keys());
  numberArray[0] = 1;
  for (i = 2; i < rootNumber; i++) {
    for (j = i * i; j <= range; j += i) numberArray[j] = 0;
  }
  const result = numberArray.filter(Number);
  result.shift();
  result.shift();
  return result;
};

app.get("/cal", (req, res) => {
  const number = req.body.number;
  console.time("computation");
  const computedResult = sieve(number);
  console.timeEnd("computation");
  res.json({
    result: computedResult,
    length: computedResult.length,
  });
});

app.get("/distribute", (req, res) => {
  const number = req.body.number;
  const clients = io.sockets.adapter.rooms.get("worker_room");
  const numClients = clients ? clients.size : 0;
  cloudNumeracy = Array.from(Array(number).keys());
  cloudNumeracy[0] = 1;
  const rootNumber = Math.floor(Math.sqrt(number));
  if (numClients == 0) {
    res.json({
      workers: numClients,
      message: "no workers available",
    });
  } else {
    const carray = Array.from(clients);
    let work = Math.round(rootNumber / numClients);
    let works = [...Array(rootNumber).keys()];
    works.shift();
    works.shift();
    works.push(rootNumber);
    for (let i = 0; i < numClients; i++) {
      let lstate = 0;
      for (let j = lstate; j < work - 1; j++) {
        io.to(carray[i]).emit("doWork", {
          range: number,
          filter: works[j] ?? 1,
        });
      }
      lstate += work;
    }
    goal = rootNumber - 1;
    res.json({
      workers: numClients,
      message:
        "Your works process has been sent succesfully, check console for results",
    });
  }
});

app.get("/ping", (req, res) => {
  res.send("pong");
});
server.listen(3000, () => {
  console.log("listening on *:3000");
});

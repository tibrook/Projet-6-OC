const http = require("http");
const app = require("./app");

/* return valid port */
const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
/* saving env var or port 3000 */
const port = normalizePort(process.env.PORT || "3000");

/* Adding port to express app */
app.set("port", port);

/* Research &  manages errors*/
const errorHandler = (error) => {
  if (error.syscall !== "listen") {
    /* Lève une exception */
    throw error;
  }
  /* Méthode de http */
  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port: " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges.");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use.");
      process.exit(1);
      break;
    default:
      throw error;
  }
};
/* Create server */
const server = http.createServer(app);

/* Launch server */
server.on("error", errorHandler);

/* listen adress:port */
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log("Listening on " + bind);
});
/* start the http server listening for connections */
server.listen(port);

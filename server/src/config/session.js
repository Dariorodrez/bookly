// server/src/config/session.js
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const env = require("./env");

module.exports = session({
  store: new SQLiteStore({
    db: "sessions.db",
    dir: "./",
    table: "sessions",
  }),
  name: "bookly.sid",
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
  },
});

const limitter = require("express-rate-limit");

const registerLimitter = limitter({
    windowsMs: 5 * 60 * 1000,
    max: 3,
    message: "Trop de tentatives"
})
const loginLimitter = limitter({
    windowMs: 5 * 60 * 1000,
    max: 5,
})
module.exports = {
    register: registerLimitter,
    login: loginLimitter
}

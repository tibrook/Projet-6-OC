const limitter = require("express-rate-limit");

const registerLimitter = limitter({
    windowsMs: 1 * 60 * 1000,
    max: 2,
    message: "t'as trop essayé fréro"
})
const loginLimitter = limitter({
    windowMs: 1 * 60 * 1000,
    max: 5,
})
module.exports = {
    register: registerLimitter,
    login: loginLimitter
}

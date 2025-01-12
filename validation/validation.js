const joi = require("joi");

module.exports = {
    registerValidation: joi.object({
        username: joi.string().required().messages({
            "string.empty": "Name is required",
            "any.required": "Name is required"
        }),
        // phone: joi.string()
        //     .length(10)
        //     .pattern(/^[0-9]+$/)
        //     .required()
        //     .messages({
        //         "string.empty": "Phone number is required",
        //         "any.required": "Phone number is required",
        //         "string.length": "Phone number must be exactly 10 digits",
        //         "string.pattern.base": "Phone number must only contain digits"
        //     }),
        email: joi.string().email().required().messages({
            "string.email": "Please provide a valid email address"
        }),
        password: joi.string().min(6).required().messages({
            "string.empty": "Password is required",
            "any.required": "Password is required",
            "string.min": "Password must be at least 6 characters"
        }),
    }),
};

exports.validationMiddleware = (validationSchema) => {
    return (req, res, next) => {
        const { error } = validationSchema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                status: 'error',
                message: error.details[0].message
            });
        }  
        next();
    };
};
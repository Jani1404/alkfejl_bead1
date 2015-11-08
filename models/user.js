var bcrypt = require('bcryptjs');

module.exports = {
    identity: 'user',
    connection: 'default',
    
    attributes: {
        keresztnev: {
            type: 'string',
            required: true,
        },
        vezeteknev: {
            type: 'string',
            required: true,
        },
        felhasznev: {
            type: 'string',
            required: true,
            unique: true,
        },
        jelszo: {
            type: 'string',
            required: true,
        },
        recipes: {
            collection: 'recipe',
            via: 'user'
        },
        
        validPassword: function (jelszo) {
            return bcrypt.compareSync(jelszo, this.jelszo);
        },
    },
    beforeCreate: function(values, next) {
        bcrypt.hash(values.jelszo, 12, function(err, hash) {
            if (err) {
                return next(err);
            }
            values.jelszo = hash;
            next();
        });
    },
};
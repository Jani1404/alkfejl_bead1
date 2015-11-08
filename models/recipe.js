module.exports = {
    identity: 'recipe',
    connection: 'disk',
    attributes: {
        
        date: {
            type: 'datetime',
            defaultsTo: function () { return new Date() },
            required: true,
        },
        allapot: {
            type: 'string',
            enum: ['uj', 'elfogadott'],
            required: true,
        },
        nev: {
            type: 'string',
            required: true,
        },
        elkeszites: {
            type: 'string',
            required: true,
        },
        
        user: {
           model: 'user',
        },
    }
}
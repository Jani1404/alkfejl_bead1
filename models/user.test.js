var expect = require("chai").expect;
var bcrypt = require('bcryptjs');

var Waterline = require('waterline');
var waterlineConfig = require('../config/waterline');
var userCollection = require('./user');
var errorCollection = require('./recipe');

var User;

before(function (done) {
    // ORM indítása
    var orm = new Waterline();

    orm.loadCollection(Waterline.Collection.extend(userCollection));
    orm.loadCollection(Waterline.Collection.extend(errorCollection));
    waterlineConfig.connections.default.adapter = 'memory';

    orm.initialize(waterlineConfig, function(err, models) {
        if(err) throw err;
        User = models.collections.user;
        done();
    });
});

describe('UserModel', function () {

    function getUserData() {
        return {
            felhasznev: 'jj',
            jelszo: 'j',
            vezeteknev: 'Gipsz',
            keresztnev: 'Jakab',
        };
    }

    beforeEach(function (done) {
        User.destroy({}, function (err) {
            done();
        });
    });
    
    it('should be able to create a user', function () {
        return User.create({
                felhasznev: 'jj',
                jelszo: 'j',
                vezeteknev: 'Gipsz',
                keresztnev: 'Jakab',
        })
        .then(function (user) {
            expect(user.felhasznev).to.equal('jj');
            expect(bcrypt.compareSync('j', user.jelszo)).to.be.true;
            expect(user.surname).to.equal('Gipsz');
            expect(user.forename).to.equal('Jakab');
        });
    });

    it('should be able to find a user', function() {
        return User.create(getUserData())
        /*.then(function(user) {
            return User.findOneByNeptun(user.neptun);
        })*/
        .then(function (user) {
            expect(user.felhasznev).to.equal('jj');
            expect(bcrypt.compareSync('j', user.jelszo)).to.be.true;
            expect(user.vezeteknev).to.equal('Gipsz');
            expect(user.keresztnev).to.equal('Jakab');
        });
    });

    describe('#validPassword', function() {
        it('should return true with right password', function() {
             return User.create(getUserData()).then(function(user) {
                 expect(user.validPassword('j')).to.be.true;
             })
        });
        it('should return false with wrong password', function() {
             return User.create(getUserData()).then(function(user) {
                 expect(user.validPassword('titkos')).to.be.false;
             })
        });
    });

});
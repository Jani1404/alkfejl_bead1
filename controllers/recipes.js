var express = require('express');
var router = express.Router();
var allapotTexts = {
    'uj': 'Új',
    'elfogadott': 'Elfogadott',
};
var allapotClasses = {
    'new': 'danger',
    'elfogadott': 'success',
};

function decorateRecipes(recipeContainer) {
    return recipeContainer.map(function (e) {
        e.allapotText = allapotTexts[e.allapot];
        e.allapotClass = allapotClasses[e.allapot];
        return e;
    });
}

router.get('/szerkeszt/:id', function (req, res) {
    req.app.models.recipe.find({ id: req.params.id })
    .then(function (r) {
        res.render('recipes/new', {
            data: r
        });
    })
});

// Recept szerkesztese
router.get('/edit/:id', function(req, res) {
    var fId = req.param('id');
    req.app.models.recipe.find({
        id: fId
    }).then(function(found) {
        res.render('recipes/editor', {
            nev: found[0].nev,
            elkeszites: found[0].elkeszites
        });
    });
});

router.post('/edit/:id', function (req, res) {
    // adatok ellenőrzése
    req.checkBody('nev', 'Hibás étel név').notEmpty().withMessage('Kötelező megadni!');
    req.sanitizeBody('elkeszites').escape();
    req.checkBody('elkeszites', 'Hibás elkészítés').notEmpty().withMessage('Kötelező megadni!');
    
    var validationErrors = req.validationErrors(true);
    console.log(validationErrors);
    console.log(req.body);
    
    var fId = req.param('id');
    
    if (validationErrors) {
        req.flash('validationErrors', validationErrors);
        req.flash('info', 'Recept szerkesztése nem sikerult!');
        res.redirect('/recipes/list');
    }
    else {
        req.app.models.recipe.update({id: fId}, {
                nev: req.body.nev,
                elkeszites: req.body.elkeszites,
                allapot: req.body.allapot
        })
        .then(function (recipe) {
            //siker
            req.flash('info', 'Recept szerkesztése sikeres volt!');
            res.redirect('/recipes/list');
        })
        .catch(function (err) {
            //hiba
            console.log(err);
        });
    }
});


router.get('/list', function (req, res) {
    req.app.models.recipe.find().then(function (recipes) {
        console.log(recipes);
        
        //megjelenítés
        res.render('recipes/list', {
            recipes: decorateRecipes(recipes),
            messages: req.flash('info')
        });
    });
});
router.get('/new', function (req, res) {
    var validationErrors = (req.flash('validationErrors') || [{}]).pop();
    var data = (req.flash('data') || [{}]).pop();
    
    res.render('recipes/new', {
        validationErrors: validationErrors,
        data: data,
    });
});
router.post('/new', function (req, res) {
    // adatok ellenőrzése
    req.checkBody('nev', 'Hibás recept név').notEmpty().withMessage('Kötelező megadni!');
    req.sanitizeBody('elkeszites').escape();
    req.checkBody('elkeszites', 'Hibás elkészítés').notEmpty().withMessage('Kötelező megadni!');
    
    var validationErrors = req.validationErrors(true);
    console.log(validationErrors);
    console.log(req.body);
    
    if (validationErrors) {
        req.flash('validationErrors', validationErrors);
        req.flash('data', req.body);
        res.redirect('/recipes/new');
    }
    else {
        req.app.models.recipe.create({
            allapot: 'uj',
            nev: req.body.nev,
            elkeszites: req.body.elkeszites,
            user: req.user,
        })
        .then(function (recipe) {
            //siker
            req.flash('info', 'Recept sikeresen beküldve!');
            res.redirect('/recipes/list');
        })
        .catch(function (err) {
            //hiba
            console.log(err);
        });
    }
});

module.exports = router;
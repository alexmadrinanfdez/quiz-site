const Sequelize = require('sequelize');
const {models} = require('../models');
const paginate = require('../helpers/paginate').paginate;

// Autoload user (:userId)
exports.load = (req, res, next, userId) => {
    models.user.findById(userId)
        .then(user => {
            if (user) {
                req.user = user;
                next();
            } else {
                req.flash('error', `There's no user with id = ${userId}`);
                throw new Error(`userId = ${userId} doesn't exist`);
            }
        })
        .catch(error => next(error));
};

// GET /users
exports.index = (req, res, next) => {
    models.user.count()
        .then(count => {
            // Pagination:
            const items_per_page = 7;
            const pageno = parseInt(req.query.pageno || 1);
            /*
             * Create a string with the HTML used to render the pagination buttons.
             * This string is added to a local variable of res, which is used into the application layout file
             */
            res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);
            const findOptions = {
                offset: items_per_page * (pageno - 1),
                limit: items_per_page,
                order: ['username']
            };
            return models.user.findAll(findOptions);
        })
        .then(users => res.render('users/index', { users }))
        .catch(error => next(error));
};
// GET /users/:userId
exports.show = (req, res, next) => {
    const {user} = req;
    res.render('users/show', { user });
};
// GET /users/new
exports.new = (req, res, next) => {
    const user = {username: '', password: ''};
    res.render('users/new', { user });
};
// POST /users
exports.create = (req, res, next) => {
    const {username, password} = req.body;
    const user = models.user.build({
        username,
        password
    });
    user.save({fields: ['username', 'password', 'salt']})
        .then(user => {
            req.flash('success', 'User created succesfully.');
            if (req.session.user) res.redirect(`/users/${user.id}`);
            else res.redirect('/session'); // Redirection to login page
        })
        .catch(Sequelize.UniqueConstraintError, error => {
            req.flash('error', `User "${username}" already exists.`);
            res.render('users/new', { user });
        })
        .catch(Sequelize.ValidationError, error => {
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('users/new', { user });
        })
        .catch(error => next(error));
};
// GET /users/:userId/edit
exports.edit = (req, res, next) => {
    const {user} = req;
    res.render('users/edit', { user });
};
// PUT /users/:userId
exports.update = (req, res, next) => {
    const {user, body} = req;
    user.password = body.password;
    if (!body.password) {
        req.flash('error', 'Password must be filled in.');
        return res.render('users/edit', { user });
    }
    user.save({fields: ['password', 'salt']})
        .then(user => {
            req.flash('success', 'User updated successfully.');
            res.redirect(`/users/${user.id}`);
        })
        .catch(Sequelize.ValidationError, error => {
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('users/edit', {user})
        })
        .catch(error => next(error));
};
// DELETE /users/:userId
exports.destroy = (req, res, next) => {
    req.user.destroy()
        .then(() => {
            // Deleting logged user => close session
            if (req.session.user && req.session.user.id === req.user.id) delete req.session.user;
            req.flash('success', 'User deleted successfully.');
            res.redirect('/goback');
        })
        .catch(error => next(error));
};
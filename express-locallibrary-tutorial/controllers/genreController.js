var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {
  Genre.find()
    .sort([['name', 'ascending']])
    .exec(function (err, genre_list) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('genre_list', { title: 'Genre List', genre_list: genre_list});
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
          Book.find({ 'genre': req.params.id })
          .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) {
  res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post =  [

  // Validate that the name field is not empty.
  body('name', 'Genre name required').isLength({ min: 1 }).trim(),

  // Sanitize (trim and escape) the name field.
  sanitizeBody('name').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a genre object with escaped and trimmed data.
    var genre = new Genre(
      { name: req.body.name }
    );


    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
    return;
    }
    else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
        .exec( function(err, found_genre) {
           if (err) { return next(err); }

           if (found_genre) {
             // Genre exists, redirect to its detail page.
             res.redirect(found_genre.url);
           }
           else {

             genre.save(function (err) {
               if (err) { return next(err); }
               // Genre saved. Redirect to genre detail page.
               res.redirect(genre.url);
             });

           }

         });
    }
  }
];

const genre_and_books_cb = function(genre_id) {
  return {
      genre: function(callback) {
          Genre.findById(genre_id)
            .exec(callback);
      },
      book_list: function(callback) {
        Book.find({ 'genre': genre_id })
        .exec(callback);
      }
    }
}

// Handle Genre delete on GET/POST.
genre_delete = function(req, res, next) {
  let genre_id = req.params.id;
  async.parallel(genre_and_books_cb(genre_id), function(err, results) {
      if (err) { return next(err); }
      if (results.genre==null) { // No results.
          var err = new Error('Genre not found');
          err.status = 404;
          return next(err);
      }
      if (req.method == 'GET' || results.book_list.length > 0) {
          res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, book_list: results.book_list });
          return;
      }
      if (req.method == 'POST') {
          // Genre has no books. Delete object and redirect to the list of authors.
          Genre.findByIdAndRemove(genre_id, function deleteGenre(err) {
              if (err) { return next(err); }
              // Success - go to author list
              res.redirect('/catalog/genres')
          })
      } else {
        var err = new Error("GET WITH BOOK LIST == 0 - should never get here!");
        err.status = 404;
        return next(err);
      }
  });
};

// Display Genre delete form on GET.
exports.genre_delete_get = genre_delete;

// Handle Genre delete on POST.
exports.genre_delete_post = genre_delete;

// Display Genre update form on GET.
exports.genre_update_get = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update GET');
};

// Handle Genre update on POST.
exports.genre_update_post = function(req, res) {
    res.send('NOT IMPLEMENTED: Genre update POST');
};

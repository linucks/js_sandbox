var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });

};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Book:', bookinstance:  bookinstance});
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    // Sanitize fields.
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function (err, bookinstance) {
    if (err) { return next(err); }
    if (bookinstance==null) { // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
    // Successful, so render.
    res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: bookinstance} );
  })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res) {
  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function (err, bookinstance) {
    if (err) { return next(err); }
    if (bookinstance==null) { // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      // Remove this instance
      // Use body but could just use req.params.id?
      BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookinstance(err) {
          if (err) { return next(err); }
          // Success - go to Bookinstance list
          res.redirect('/catalog/bookinstances')
      })
  })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
  BookInstance.findById(req.params.id)
  .populate('book')
  .exec(function (err, bookinstance) {
    if (err) { return next(err); }
    if (bookinstance==null) { // No results.
        var err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
    // Successful, so render.
    res.render('bookinstance_form', { title: 'Update BookInstance', bookinstance:bookinstance });
  })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // (req, res, next) => {console.log("bookinstance_update_post: Values:1:"+req.body.bookid+":2:"+req.body.imprint+":3:"+req.body.due_back+ ":4:"+req.body.status+":5  :"+req.params.id); next()},

  // Validate fields.
  body('bookid', 'bookid must not be empty.').isLength({ min: 1 }).trim(),
  body('due_back', 'Invalid: Date when book available: ').isISO8601(),
  body('imprint', 'imprint must not be empty.').isLength({ min: 1 }).trim(),
  body('status', 'Status must not be empty.').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  sanitizeBody('bookid').trim().escape(),
  sanitizeBody('due_back').trim().escape(),
  sanitizeBody('imprint').trim().escape(),
  sanitizeBody('status').trim().escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/error messages.
          BookInstance.findById(req.params.id)
          .populate('book')
          .exec(function (err, bookinstance) {
            if (err) { return next(err); }
            if (bookinstance==null) { // No results.
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
              }
            // Successful, so render.
            res.render('bookinstance_form', { title: 'Update BookInstance', bookinstance:bookinstance, errors: errors.array() });
          });
          return;
      }
      else {
        // Create a Book object with escaped/trimmed data and old id.
        var booki = new BookInstance(
          { book: req.body.bookid,
            imprint: req.body.imprint,
            due_back: req.body.due_back,
            status: req.body.status,
            _id: req.params.id //This is required, or a new ID will be assigned!
           });
          BookInstance.findByIdAndUpdate(req.params.id, booki, {}, function (err, booki) {
              if (err) { return next(err); }
                 // Successful - redirect to book detail page.
                 res.redirect(booki.url);
              });
      }
  }
];

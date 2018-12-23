var mongoose = require('mongoose');
var moment = require('moment');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(function () {
  let date_of_death =  this.date_of_death ? this.date_of_death : new Date();
  return (date_of_death.getYear() - this.date_of_birth.getYear()).toString();
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});

AuthorSchema
.virtual('lifespan_dates')
.get(function () {
  let date_of_death =  this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : '';
  return moment(this.date_of_birth).format('MMMM Do, YYYY') + " - " + date_of_death;
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);

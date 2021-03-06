function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Or DocumentApp or FormApp.
  ui.createMenu('Loop Menu')
      .addItem('Validate Data', 'validateData')
      .addToUi();
}

function validateData() {
  //var sheet = s.getSheetByName('Catalog')
  var ss = SpreadsheetApp.getActive()

  var catalog = new DataFrame(ss.getRange('Catalog!A:R').getValues(), 'Sample Number', 'catalog');
  var ftir = new DataFrame(ss.getRange('FTIR!A:X').getValues(), 'Sample Number', 'ftir');
  var reagent = new DataFrame(ss.getRange('Reagent!A:W').getValues(), 'Sample Number', 'reagent');

  var dataframes = [catalog, ftir, reagent];
  var duplicates, data, ret="";
  for (d in dataframes) {
    duplicates = dataframes[d].duplicates('Sample Number');
    if (duplicates.length) {
      data = dataframes[d].select(duplicates, ['Sample Number']);
      ret += "Got duplicates for sheet[" + dataframes[d].name +"]\n" + data.join('\n') + "\n";
    }
  }
  if (ret.length) {
    SpreadsheetApp.getUi().alert(ret);
  }
}

var DataFrame = function(values, key, name){

  this.init = function(values, key, name){
      if (name === undefined) {
        this.name = 'dataframe';
      } else {
        this.name = name;
      }
      if (key === undefined) {
        throw new Error("Need db key!");
      }
      this.data = this.prune_empty_rows(values);
      this.columns = this.data.shift(); // remove column header
      this.numRows = this.data.length;

      // set index - will ignore duplicates
      var keyidx = this.column_index(key);
      this.index = {};
      for (var i=0; i < this.data.length; i++) {
        var keyv = this.data[i][keyidx];
        this.index[keyv] = i;
      }
  }

  this.prune_empty_rows = function(data) {
    var row, row_len = 0, pruned_data=[];
    for (var i=0; i < data.length; i++) {
      row = data[i];
      row_len = row.reduce(function(acc, val){return val.hasOwnProperty('length') ? acc + val.length : acc + 1}, 0);
      if (row_len > 0) {pruned_data.push(row)};
    }
    return pruned_data;
  }

  /* Get the indexes of the supplied columns */
  this.column_index = function(columns) {
    if (!(columns instanceof Array)) {
      columns = [columns];
    }
    var idx, column_idxs = [];
    for (var i=0; i < columns.length; i++) {
      idx = this.columns.indexOf(columns[i]);
      if (idx == -1) {
        throw new Error("Cannot find column: " + columns[i]);
      }
      column_idxs.push(idx);
    }
    if (column_idxs.length == 1) {
      return column_idxs[0];
    } else {
      return column_idxs;
    }
  }

  /* Return the indexes of any duplicate items in column colName */
  this.duplicates = function(colName) {
    var cidx = this.columns.indexOf(colName);
    if (cidx == -1) {
      throw new Error("Could not find colName " + colName);
    }
    var counts = [];
    for (var i=0; i < this.numRows; i++) {
      var value = this.data[i][cidx];
      // Ignore empty strings
      if (value === undefined || (typeof value == 'string' && value.length == 0)) {continue};
      if (counts[value] === undefined) {
        counts[value] = 1;
      } else {
        counts[value] += 1;
      }
    }
    var duplicates = [];
    for (var i=0; i < this.numRows; i++) {
      var value = this.data[i][cidx];
      if (counts[value] > 1){
        duplicates.push(i);
      }
    }
    return duplicates;
  } // End duplicates

  /* Select data based on indexes of rows and column names */
  this.select = function(row_idxs, columns){
    if (!(row_idxs instanceof Array)) {
      row_idxs = [row_idxs];
    }
    if (columns === undefined) {
      columns = this.columns;
    }
    return this.get_rows_and_columns(row_idxs, columns);
  } //End select

  this.get_rows_and_columns = function (row_idxs, columns){
    var column_idxs = this.column_index(columns);
    var selected = [];
    for (var i=0; i < this.data.length; i++) {
      if (row_idxs.indexOf(i) == -1) {continue};
      var row = [];
      for (var j=0; j < this.data[i].length; j++) {
        if (column_idxs == j || (column_idxs.hasOwnProperty('indexOf') && column_idxs.indexOf(j) != -1 )) {
          row.push(this.data[i][j]);
        }
      }
      selected.push(row);
    }
    return selected;
  } // End get_rows_and_columns

  /* Find rows where identically labelled columns with the same index have different values */
  this.column_difference = function(d2, column) {
    var idx1, idx2, val1, val2, differences=[];
    for (var key in this.index) {
      if (key in d2.index) {
        val1 = this.select(this.index[key], column)[0][0];
        val2 = d2.select(d2.index[key], column)[0][0];
        if (val1 != val2) {
          differences.push([key, val1, val2]);
        }
      }
    }
    return differences;
  }
  // As this uses class functions I think it needs to be called at the end?
  this.init(values, key, name);

} // End Class


function column_differences(dataframes, columns){
  var d1 = dataframes[0];
  for (var i=1; i < dataframes.length; i++) {
    d2 = dataframes[i];
    for (var j=0; j < columns.length; j++) {
      column = columns[j];
      var differences = d1.column_difference(d2, column);
      if (differences.length) {
        for (var k=0; k < differences.length; k++) {
          console.log("Got differences: " + d1.name + ":" + d2.name + "   [" + column + "] \"" + differences[k][0] + "\" -> \"" + differences[k][1] + "\"")
        }
      }
    }
    d1 = d2;
  }
}

module.exports.DataFrame = DataFrame;
module.exports.column_differences = column_differences;

const dataframe = require('./LoopValidate');

var values1 = [ ["Index","Column2","Column3","Column4"],
                ["I1","X2R1","dup","C4R1"],
                ["I2","C2R2","C3R2","C4R2"],
                ["I3","C2R3","C3R3","C4R3"],
                ["I4","X2R4","dup","C4R4"]];

var values2 = [ ["Index","Column2","Column3","Column4"],
                ["I1","C2R1","dup","C4R1"],
                ["I2","C2R2","C3R2","C4R2"],
                ["I3","C2R3","C3R3","C4R3"],
                ["I4","C2R4","dup","C4R4"]];

// console.log(column_differences([df1, df2, df1],['Column2']));
// console.log(df1.column_difference(df2, 'Column2'));

test('dataframe add', () => {
  var df1 = new dataframe.DataFrame(values1, 'Index');
  var df2 = new dataframe.DataFrame(values2, 'Index', 'd2');
  expect(df1.column_difference(df2, 'Column2')).toEqual( [["I1", "X2R1", "C2R1"], ["I4", "X2R4", "C2R4"]] );
});

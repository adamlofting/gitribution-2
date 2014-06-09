/**
 * Checks if a string ends with another string
 * @param  {str} str
 * @param  {str} suffix
 * @return {boolean}
 */
function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * parse a string to a Date, and check it's a valid date
 * @param  {str} str
 * @return {Date}
 */
function parseAndCheckDate(str) {
  var date;
  date = new Date(str);
  if (Object.prototype.toString.call(date) === "[object Date]") {
    if (isNaN(date.getTime())) {
      return null;
    }
    if (date.getFullYear() > 2025) {
      return null;
    }
  } else {
    return null;
  }
  return date;
}

/**
 * Convert a JS date to string "YYYY-MM-DD"
 * @param  {Date} date
 * @return {str}
 */
function dateToISOtring(date) {
  var year = date.getFullYear();
  var month = ('0' + (date.getMonth() + 1)).slice(-2); // 0 index
  var day = ('0' + date.getDate()).slice(-2);
  return year + '-' + month + '-' + day;
}

/**
 * Counts occurances in Array A that are not in Array B
 * @param  {Array} arrA
 * @param  {Array} arrB
 * @return {Int}
 */
function countInAnotInB(arrA, arrB) {
  var count = 0;
  for (var i = 0; i < arrA.length; i++) {
    if (arrB.indexOf(arrA[i]) === -1) {
      count++;
    }
  }
  return count;
}

/**
 * Extract named field from the object and return as an array
 * @param  {obj} obj
 * @param  {String} fieldname
 * @return {Array}
 */
function fieldToArray(obj, fieldname) {
  var arr = [];
  for (var i = 0; i < obj.length; i++) {
    arr.push(obj[i][fieldname]);
  }
  return arr;
}

module.exports = {
  dateToISOtring: dateToISOtring,
  fieldToArray: fieldToArray,
  countInAnotInB: countInAnotInB,
  endsWith: endsWith,
  parseAndCheckDate: parseAndCheckDate,
};

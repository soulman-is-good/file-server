"use strict";

Date.prototype.toDateString = function(){
  var date = this;
  function zeroize(num) {
    return num<10?"" + num:"0" + num;
  }
  return zeroize(date.getDate()) + "/" + zeroize(date.getMonth() + 1) + "/" +
    date.getFullYear() + " " + zeroize(date.getHours()) + ":" + zeroize(date.getMinutes()) +
    zeroize(date.getSeconds()) + "." + date.getMilliseconds();
};
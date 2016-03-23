
var Quiz = function() {
  console.log("quiz initiated!");
  this.canvas = null;
  this.ctx = null;
  this.form = null;
};

Quiz.prototype.setCanvas = function(canvas, ctx) {
  this.canvas = canvas;
  this.ctx = ctx;
  console.log("canvas set");
};

Quiz.prototype.checkAnswers = function() {
  // visually display results of quiz - can use canvas to display answers
  // - draw green ticks, red crosses, etc.
  this.ctx.fillstyle = "#000000";
  this.ctx.fillRect(10, 10, 30, 40);
  return false;
};

Quiz.prototype.saveAnswers = function() {
  // save to local storage
  return false;
};

Quiz.prototype.loadAnswers = function() {
  // load from local storage if available
  return false;
};


Quiz.prototype.init = function(formId) {

  this.form = $(formId);
  if (!this.form) {
    console.log("ERROR: no form element found with selector to init quiz");
    return; // fail, no form
  }

  // check answers on user submit
  // note - functions expected to return false to avoid actually submitting form
  this.form.find('.submitquiz').click(this.checkAnswers.bind(this));

  // save and load buttons
  this.form.find('.savequiz').click(this.saveAnswers.bind(this));
  this.form.find('.loadquiz').click(this.loadAnswers.bind(this));

};




// code to run when page loads
$(document).ready(function() {

  thequiz = new Quiz();

  var canvas = document.getElementById('quizcanvas');
  var ctx;
  if (canvas && canvas.getContext) {
    ctx = canvas.getContext('2d');
    thequiz.setCanvas(canvas, ctx);
  }

  // init the quiz on the element selector
  thequiz.init("#quizform");
  thequiz.setCanvas(canvas, ctx);

});




// basic constructor for the Quiz object
// methods are added to its prototype below
var Quiz = function() {
  this.canvas = null;
  this.ctx = null;
  this.form = null;
  this.name = null;
};

// set the canvas for the quiz to draw to
// (to be used for displaying scores, feedback, etc.)
Quiz.prototype.setCanvas = function(canvas, ctx) {
  this.canvas = canvas;
  this.ctx = ctx;
};

// check the answers!
// TODO: use the canvas to draw fancy ticks, crosses, visual feedback, etc.
Quiz.prototype.checkAnswers = function() {
  this.ctx.fillstyle = "#0000AA";
  this.ctx.fillRect(10, 10, 30, 40);
  return false;
};


// save all answers to localstorage
Quiz.prototype.saveAnswers = function() {
  console.log('saving answers');

  // save to local storage
  var questions = this.form.find('.question');
  questions.each(function(_, q) {
    q = $(q);
    t = q.prop('type');
    var question = this.name + '.' + q.prop('name');
    var value = q.val();
    if (t == 'text') {
      localStorage.setItem(question, value);
    } else if (t == 'radio') {
      if (q.prop('checked')) {
        localStorage.setItem(question, value);
      }
    } else if (q[0].tagName == 'SELECT') {
      value = q.find('option:selected').val();
      localStorage.setItem(question, value);
    }
  }.bind(this));

  return false;
};


// load all answers from localstorage, ignores if not set
Quiz.prototype.loadAnswers = function() {

  // load from local storage if available
  var questions = this.form.find('.question');
  questions.each(function(_, q) {
    q = $(q);
    t = q.prop('type');
    var question = this.name + '.' + q.prop('name');
    var value = localStorage.getItem(question);
    if (value) {
      if (t == 'text') {
        q.val(value);
      } else if (t == 'radio') {
        if (q.val() == value) {
          q.prop('checked', true);
        }
      } else if (q[0].tagName == 'SELECT') {
        q.find('option').each(function(_, opt) {
          if (opt.value == value) {
            opt.selected = true;
          }
        }.bind(this));
      }
    }
  }.bind(this));

  return false;
};

// reset all values for the quiz (also resets localstorage)
Quiz.prototype.reset = function() {

  // remove all items for this quiz from localstorage
  var questions = this.form.find('.question');
  questions.each(function(_, q) {
    q = $(q);
    var question = this.name + '.' + q.prop('name');
    localStorage.removeItem(question);
  }.bind(this));

  this.form[0].reset();

  return false;
};


Quiz.prototype.autosave = function() {
  if (!this.form) {
    return;
  }
  this.form.find('.question').change(this.saveAnswers.bind(this));
  this.form.find('.question[type=text]').on('keyup', this.saveAnswers.bind(this));
};


// initialize the quiz on a form element (by id)
Quiz.prototype.init = function(formId) {

  this.name = formId;
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
  this.form.find('.resetquiz').click(this.reset.bind(this));
};



// code to run when page loads
$(document).ready(function() {

  //TODO: make this non-global when finished testing
  thequiz = new Quiz();

  var canvas = document.getElementById('quizcanvas');
  var ctx;
  if (canvas && canvas.getContext) {
    ctx = canvas.getContext('2d');
    thequiz.setCanvas(canvas, ctx);
  }

  // init the quiz on the element selector
  thequiz.init("#quizform");

  // specify the canvas to use
  thequiz.setCanvas(canvas, ctx);

  // turn on autosave and load saved answers
  thequiz.autosave(true);
  thequiz.loadAnswers();

});




//TODO: add JSDoc comments to Quiz object
// basic constructor for the Quiz object
// methods are added to its prototype below
var Quiz = function() {
  this.canvas = null;
  this.ctx = null;
  this.form = null;
  this.name = null;
  this.questions = null;
  this.numQuestions = 0;
};

// set the canvas for the quiz to draw to
// (to be used for displaying scores, feedback, etc.)
// [optional]
Quiz.prototype.setCanvas = function(canvas, ctx) {
  this.canvas = canvas;
  this.ctx = ctx;
};

// check the answers! Note: this is called when user clicks designated submit button
// TODO: use the canvas to draw fancy ticks, crosses, visual feedback, etc.
Quiz.prototype.checkAnswers = function() {
  // save the answers first
  this.saveAnswers();

  // setup the canvas for displaying answers... bla blah TODO
  this.ctx.fillstyle = "#0000AA";
  this.ctx.fillRect(10, 10, 30, 40);

  // loop over each question in the database and check if answer correct
  for (var key in this.qData) {
    var data = this.qData[key];
    
    if (data.type == 'text') {
      if (data.answer && data.correctAnswer && (new RegExp(data.correctAnswer, 'i')).test(data.answer)) {
        //TODO
        console.log(data.answer + " is correct :)");
      } else {
        console.log(data.answer + " is incorrect :(");
      }
    } else if (data.type == 'select') {
      if (data.answer === data.correctAnswer) { // using triple equals to avoid problems if answer is undefined
        //TODO
        console.log(data.answer + " is correct :)");
      } else {
        console.log(data.answer + " is incorrect :(");
      }
    } else if (data.type == 'radio') {
      if (data.answer === data.correctAnswer) {
        //TODO
        console.log(data.answer + " is correct :)");
      } else {
        console.log(data.answer + " is incorrect :(");
      }
    }

  }


  return false;
};


// save all answers to localstorage
// autosave also uses this method
Quiz.prototype.saveAnswers = function() {

  this.questions.each(function(i, q) {
    q = $(q);
    t = q.prop('type');
    var question = q.prop('name');
    var key = this.name + '.' + q.prop('name');
    var value = $.trim(q.val());
    if (t == 'text') {
      localStorage.setItem(key, value);
      this.qData[question].answer = value;
    } else if (t == 'radio') {
      if (q.prop('checked')) {
        localStorage.setItem(key, value);
        this.qData[question].answer = value;
      }
    } else if (q[0].tagName == 'SELECT') {
      value = q.find('option:selected').val();
      localStorage.setItem(question, value);
      this.qData[question].answer = value;
    }
  }.bind(this));

  return false;
};


// load all answers from localstorage, ignores if not set
Quiz.prototype.loadAnswers = function() {

  this.questions.each(function(i, q) {
    q = $(q);
    t = q.prop('type');
    var question = q.prop('name');
    var key = this.name + '.' + q.prop('name');
    var value = localStorage.getItem(key);
    this.qData[question].answer = value;
    if (value) {
      if (t == 'text') {
        q.val(value);
      } else if (t == 'radio') {
        if (q.val() == value) {
          q.prop('checked', true);
        }
      } else if (q[0].tagName == 'SELECT') {
        q.find('option').each(function(i, opt) {
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
  //TODO: error checking in these functions to make sure form element accessible, etc. before continuing

  // remove all items for this quiz from localstorage
  var questions = this.form.find('.question');
  questions.each(function(i, q) {
    q = $(q);
    var question = this.name + '.' + q.prop('name');
    localStorage.removeItem(question);
  }.bind(this));

  this.form[0].reset();

  return false;
};


Quiz.prototype.autosave = function(yes) {
  if (!this.form) {
    return;
  }
  if (yes) {
    // add event handlers to save answers whenever answer changed
    this.form.find('.question').change(this.saveAnswers.bind(this));
    this.form.find('.question[type=text]').on('keyup', this.saveAnswers.bind(this));
  } else {
    // remove event handlers, so will not autosave
    this.form.find('.question').off();
  }

};


// initialize the quiz on a form element (by id)
Quiz.prototype.init = function(formId) {

  this.name = formId;
  this.form = $(formId);
  if (!this.form) {
    console.log("ERROR: no form element found with selector to init quiz");
    return false; // fail, no form
  }

  this.questions = this.form.find('.question');

  this.qData = {};

  // check answers on user submit
  // note - functions expected to return false to avoid actually submitting form
  this.form.find('.submitquiz').click(this.checkAnswers.bind(this));

  // save and load buttons
  this.form.find('.savequiz').click(this.saveAnswers.bind(this));
  this.form.find('.loadquiz').click(this.loadAnswers.bind(this));
  this.form.find('.resetquiz').click(this.reset.bind(this));

  // init a dictionary of the questions and values (correct and otherwise) for ease of getting later
  var count = 1;
  for (var i = 0; i < this.questions.length; i++) {
    q = $(this.questions[i]);
    t = q.prop('type');
    var question = q.prop('name');
    if (t == 'text') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.data('answer').toString();
      this.qData[question].type = 'text';
      this.qData[question].index = count++;
    } else if (t == 'radio') {
      if (q.data('answer') !== undefined) {
        this.qData[question] = {};
        this.qData[question].correctAnswer = q.data('answer').toString();
        this.qData[question].index = count++;
        this.qData[question].type = 'radio';
      }
    } else if (q[0].tagName == 'SELECT') {
      this.qData[question] = {};
      this.qData[question].correctAnswer = q.data('answer').toString();
      this.qData[question].index = count++;
      this.qData[question].type = 'select';
    }

  }

  this.numQuestions = Object.keys(this.questions).length;

  return true;
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


